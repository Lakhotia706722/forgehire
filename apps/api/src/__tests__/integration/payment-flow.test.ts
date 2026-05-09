import { describe, it, expect, beforeEach } from '@jest/globals';
import { prisma, createTestUser, createTestContract, mockRazorpayWebhook } from '../setup-tests';
import { EscrowService } from '../../services/escrow.service';
import { PayoutService } from '../../services/payout.service';
import { WalletService } from '../../services/wallet.service';
import { WebhookService } from '../../services/webhook.service';

// Skip integration tests when no test database is available
const hasTestDb = process.env.TEST_DATABASE_URL || 
  (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));
const describeOrSkip = hasTestDb ? describe : describe.skip;

describeOrSkip('Payment Flow Integration Tests', () => {
  let companyUser: any;
  let engineerUser: any;
  let contract: any;
  let escrowService: EscrowService;
  let payoutService: PayoutService;
  let walletService: WalletService;
  let webhookService: WebhookService;

  beforeEach(async () => {
    // Create test users
    companyUser = await createTestUser({ role: 'company' });
    engineerUser = await createTestUser({ role: 'engineer' });

    // Create test contract
    contract = await createTestContract({
      companyUserId: companyUser.id,
      engineerUserId: engineerUser.id,
      totalAmount: 10000
    });

    // Initialize services
    escrowService = new EscrowService();
    payoutService = new PayoutService();
    walletService = new WalletService();
    webhookService = new WebhookService();
  });

  describe('Deposit → Milestone → Approve → Release → Payout Flow', () => {
    it('should complete full payment flow successfully', async () => {
      // Step 1: Deposit escrow
      const escrowDeposit = await escrowService.depositEscrow({
        contractId: contract.id,
        userId: companyUser.id,
        amount: 10000
      });

      expect(escrowDeposit.orderId).toBeDefined();
      expect(escrowDeposit.amount).toBe(10000);

      // Step 2: Verify payment (simulate Razorpay callback)
      const verification = await escrowService.verifyEscrowPayment({
        orderId: escrowDeposit.orderId,
        paymentId: 'pay_test123',
        signature: 'test_signature'
      });

      // Note: This will fail signature verification in real scenario
      // In production, use actual Razorpay signature

      // Step 3: Check escrow is funded
      const isFunded = await escrowService.isEscrowFunded(contract.id);
      expect(isFunded).toBe(true);

      // Step 4: Create milestone
      const milestone = await prisma.milestonePayment.create({
        data: { contractId: contract.id, milestoneNumber: 1, title: 'Milestone 1', description: 'Test milestone', amount: 5000, status: 'pending' as any }
      });

      // Step 5: Submit milestone
      await prisma.milestonePayment.update({
        where: { id: milestone.id },
        data: { status: 'submitted' }
      });

      // Step 6: Approve milestone
      await prisma.milestonePayment.update({
        where: { id: milestone.id },
        data: {
          status: 'approved',
          approvedAt: new Date()
        }
      });

      // Step 7: Release milestone to wallet
      const escrowAccount = await escrowService.getEscrowAccount(contract.id);
      const release = await escrowService.releaseMilestone({
        escrowAccountId: escrowAccount!.id,
        milestoneId: milestone.id,
        amount: 5000,
        recipientUserId: engineerUser.id,
        approvedBy: companyUser.id
      });

      expect((release as any).release.status).toBe('processing');

      // Step 8: Credit wallet
      await walletService.creditWallet({
        userId: engineerUser.id,
        amount: 5000,
        description: 'Milestone payment',
        paymentId: release.payment.id
      });

      // Step 9: Check wallet balance
      const balance = await walletService.getBalance(engineerUser.id);
      expect(balance).toBe(5000);

      // Step 10: Request payout
      const payout = await payoutService.requestPayout({
        userId: engineerUser.id,
        engineerProfileId: 'test-profile-id',
        amount: 5000,
        method: 'upi',
        upiId: 'test@upi'
      });

      expect(payout.status).toBe('pending');

      // Step 11: Check wallet debited
      const newBalance = await walletService.getBalance(engineerUser.id);
      expect(newBalance).toBe(0);

      // Step 12: Simulate payout completion webhook
      const webhook = mockRazorpayWebhook('payout.processed', {
        payout: {
          entity: {
            id: payout.razorpayPayoutId,
            status: 'processed',
            utr: 'UTR123456'
          }
        }
      });

      await webhookService.handleRazorpayWebhook(webhook);

      // Step 13: Verify payout completed
      const completedPayout = await prisma.payout.findUnique({
        where: { id: payout.id }
      });

      expect(completedPayout?.status).toBe('completed');
      expect(completedPayout?.utr).toBe('UTR123456');
    });

    it('should prevent double-release of milestone', async () => {
      // Setup escrow
      const escrowDeposit = await escrowService.depositEscrow({
        contractId: contract.id,
        userId: companyUser.id,
        amount: 10000
      });

      const escrowAccount = await escrowService.getEscrowAccount(contract.id);

      const milestone = await prisma.milestonePayment.create({
        data: { contractId: contract.id, milestoneNumber: 1, title: 'Milestone 1', description: 'Test milestone', amount: 5000, status: 'approved' as any }
      });

      // First release
      await escrowService.releaseMilestone({
        escrowAccountId: escrowAccount!.id,
        milestoneId: milestone.id,
        amount: 5000,
        recipientUserId: engineerUser.id,
        approvedBy: companyUser.id
      });

      // Attempt second release (should fail)
      await expect(
        escrowService.releaseMilestone({
          escrowAccountId: escrowAccount!.id,
          milestoneId: milestone.id,
          amount: 5000,
          recipientUserId: engineerUser.id,
          approvedBy: companyUser.id
        })
      ).rejects.toThrow('Milestone already released');
    });

    it('should enforce minimum payout amount', async () => {
      // Credit wallet with small amount
      await walletService.creditWallet({
        userId: engineerUser.id,
        amount: 400,
        description: 'Test payment'
      });

      // Attempt payout below minimum
      await expect(
        payoutService.requestPayout({
          userId: engineerUser.id,
          engineerProfileId: 'test-profile-id',
          amount: 400,
          method: 'upi',
          upiId: 'test@upi'
        })
      ).rejects.toThrow('Minimum payout amount is ₹500');
    });

    it('should refund wallet on payout failure', async () => {
      // Credit wallet
      await walletService.creditWallet({
        userId: engineerUser.id,
        amount: 1000,
        description: 'Test payment'
      });

      // Request payout
      const payout = await payoutService.requestPayout({
        userId: engineerUser.id,
        engineerProfileId: 'test-profile-id',
        amount: 1000,
        method: 'upi',
        upiId: 'test@upi'
      });

      // Simulate payout failure webhook
      const webhook = mockRazorpayWebhook('payout.failed', {
        payout: {
          entity: {
            id: payout.razorpayPayoutId,
            status: 'failed',
            status_details: {
              description: 'Invalid UPI ID'
            }
          }
        }
      });

      await webhookService.handleRazorpayWebhook(webhook);

      // Check wallet refunded
      const balance = await walletService.getBalance(engineerUser.id);
      expect(balance).toBe(1000);

      // Check payout marked as failed
      const failedPayout = await prisma.payout.findUnique({
        where: { id: payout.id }
      });

      expect(failedPayout?.status).toBe('failed');
    });
  });

  describe('Dispute Flow', () => {
    it('should handle partial release in dispute', async () => {
      // Setup escrow with funded amount
      const escrowDeposit = await escrowService.depositEscrow({
        contractId: contract.id,
        userId: companyUser.id,
        amount: 10000
      });

      const escrowAccount = await escrowService.getEscrowAccount(contract.id);

      // Simulate dispute resolution: 60% to engineer, 40% refund to company
      const engineerAmount = 6000;
      const companyRefund = 4000;

      // Release to engineer
      await escrowService.releaseMilestone({
        escrowAccountId: escrowAccount!.id,
        milestoneId: 'dispute-resolution',
        amount: engineerAmount,
        recipientUserId: engineerUser.id,
        approvedBy: 'admin-id'
      });

      // Refund to company
      await escrowService.refundEscrow({
        escrowAccountId: escrowAccount!.id,
        amount: companyRefund,
        recipientUserId: companyUser.id,
        reason: 'Dispute resolution - partial refund'
      });

      // Verify escrow account state
      const updatedEscrow = await escrowService.getEscrowAccount(contract.id);
      expect(parseFloat(updatedEscrow!.releasedAmount.toString())).toBe(engineerAmount);
      expect(parseFloat(updatedEscrow!.refundedAmount.toString())).toBe(companyRefund);
    });
  });

  describe('Auto-approve Flow', () => {
    it('should auto-approve milestone after 72 hours', async () => {
      // Setup escrow
      const escrowDeposit = await escrowService.depositEscrow({
        contractId: contract.id,
        userId: companyUser.id,
        amount: 10000
      });

      const escrowAccount = await escrowService.getEscrowAccount(contract.id);

      // Create submitted milestone
      const milestone = await prisma.milestonePayment.create({
        data: { contractId: contract.id, milestoneNumber: 1, title: 'Milestone 1', description: 'Test milestone', amount: 5000, status: 'submitted' as any, submittedAt: new Date(Date.now() - 73 * 60 * 60 * 1000) }
      });

      // Process auto-approve
      const result = await escrowService.processAutoApprove(milestone.id);

      expect(result).toBeDefined();
      if ('release' in result) {
        expect(result.release).toBeDefined();
      }

      // Verify milestone approved
      const approvedMilestone = await prisma.milestonePayment.findUnique({
        where: { id: milestone.id }
      });

      expect(approvedMilestone?.status).toBe('approved');
      expect(approvedMilestone?.approvalNotes).toContain('Auto-approved');
    });
  });
});

