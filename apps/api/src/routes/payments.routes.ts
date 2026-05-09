import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../services/wallet.service';
import { PayoutService } from '../services/payout.service';
import { InvoiceService } from '../services/invoice.service';
import { WebhookService } from '../services/webhook.service';
import { authenticate } from '../middleware/auth';
import { successResponse } from '@neuronhire/shared';
import { z } from 'zod';
import { PayoutMethod } from '@prisma/client';

const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  method: z.nativeEnum(PayoutMethod),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional(),
});

export async function paymentsRoutes(fastify: FastifyInstance): Promise<void> {
  const walletService = new WalletService();
  const payoutService = new PayoutService();
  const invoiceService = new InvoiceService();
  const webhookService = new WebhookService();

  // Get wallet balance + stats
  fastify.get(
    '/payments/wallet',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const stats = await walletService.getWalletStats(user.id);
      return successResponse(stats);
    }
  );

  // Get wallet earnings chart data
  fastify.get(
    '/payments/wallet/earnings',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { period = '6months' } = request.query as any;

      const prisma = (walletService as any).prisma;
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) return successResponse([]);

      const now = new Date();
      let startDate: Date;
      let groupBy: 'day' | 'month';

      if (period === '30days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
      } else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = 'month';
      } else {
        // 6months default
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        groupBy = 'month';
      }

      const transactions = await prisma.walletTransaction.findMany({
        where: {
          walletId: wallet.id,
          type: 'credit',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      });

      // Group by period
      const grouped: Record<string, { contracts: number; bounties: number; marketplace: number; total: number }> = {};

      transactions.forEach((tx: any) => {
        const d = new Date(tx.createdAt);
        const key = groupBy === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        if (!grouped[key]) grouped[key] = { contracts: 0, bounties: 0, marketplace: 0, total: 0 };

        const amount = Number(tx.amount);
        grouped[key].total += amount;

        const desc = tx.description.toLowerCase();
        if (desc.includes('contract') || desc.includes('milestone')) {
          grouped[key].contracts += amount;
        } else if (desc.includes('bounty') || desc.includes('task')) {
          grouped[key].bounties += amount;
        } else if (desc.includes('product') || desc.includes('marketplace')) {
          grouped[key].marketplace += amount;
        } else {
          grouped[key].contracts += amount;
        }
      });

      const result = Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
      return successResponse(result);
    }
  );

  // Get wallet transactions (paginated)
  fastify.get(
    '/payments/wallet/transactions',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { limit = '20', cursor } = request.query as any;

      const prisma = (walletService as any).prisma;
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
      if (!wallet) return successResponse({ transactions: [], nextCursor: null });

      const take = parseInt(limit);
      const transactions = await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id, ...(cursor ? { id: { lt: cursor } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: take + 1,
      });

      const hasMore = transactions.length > take;
      const items = hasMore ? transactions.slice(0, take) : transactions;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      return successResponse({
        transactions: items.map((tx: any) => ({
          id: tx.id,
          type: tx.type,
          amount: Number(tx.amount),
          description: tx.description,
          createdAt: tx.createdAt,
          balanceBefore: Number(tx.balanceBefore),
          balanceAfter: Number(tx.balanceAfter),
        })),
        nextCursor,
      });
    }
  );

  // Withdraw (payout request)
  fastify.post(
    '/payments/withdraw',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { amount, method, upiId } = request.body as any;

      const prisma = (walletService as any).prisma;
      const engineerProfile = await prisma.engineerProfile.findUnique({ where: { userId: user.id } });
      if (!engineerProfile) return reply.code(400).send({ success: false, error: 'Engineer profile required' });

      const payout = await payoutService.requestPayout({
        userId: user.id,
        engineerProfileId: engineerProfile.id,
        amount,
        method,
        upiId,
      });

      return reply.code(201).send(successResponse(payout));
    }
  );

  // Get invoice
  fastify.get(
    '/payments/invoice/:id',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const invoice = await invoiceService.getInvoice(id, user.id);
      return successResponse(invoice);
    }
  );

  // Razorpay webhook
  fastify.post(
    '/payments/webhook',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['x-razorpay-signature'] as string;
      const body = request.body as any;

      try {
        await webhookService.handleRazorpayWebhook({ payload: body, signature });
        return reply.code(200).send({ status: 'ok' });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    }
  );
}
