import { z } from 'zod';

// Escrow validators (renamed to avoid conflicts with task escrow)
export const depositContractEscrowSchema = z.object({
  contractId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  amount: z.number().positive().min(100, 'Minimum escrow amount is ₹100'),
  currency: z.string().default('INR')
}).refine(data => data.contractId || data.taskId, {
  message: 'Either contractId or taskId is required'
});

export const verifyEscrowPaymentSchema = z.object({
  orderId: z.string(),
  paymentId: z.string(),
  signature: z.string()
});

export const releaseMilestoneSchema = z.object({
  escrowAccountId: z.string().uuid(),
  milestoneId: z.string().uuid(),
  amount: z.number().positive(),
  recipientUserId: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  autoApprove: z.boolean().optional()
});

export const refundEscrowSchema = z.object({
  escrowAccountId: z.string().uuid(),
  amount: z.number().positive(),
  recipientUserId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters')
});

// Payout validators
export const requestPayoutSchema = z.object({
  amount: z.number().positive().min(500, 'Minimum payout amount is ₹500'),
  method: z.enum(['upi', 'neft', 'imps']),
  upiId: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  accountHolderName: z.string().optional()
}).refine(data => {
  if (data.method === 'upi') {
    return !!data.upiId;
  }
  return !!(data.accountNumber && data.ifscCode && data.accountHolderName);
}, {
  message: 'Required payment method details are missing'
});

// KYC validators
export const submitAadhaarSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{12}$/, 'Aadhaar number must be 12 digits'),
  documentUrl: z.string().url('Invalid document URL')
});

export const submitPANSchema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
  documentUrl: z.string().url('Invalid document URL')
});

export const manuallyVerifyKYCSchema = z.object({
  userId: z.string().uuid(),
  verifiedBy: z.string().uuid()
});

export const rejectKYCSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  rejectedBy: z.string().uuid()
});

// Invoice validators
export const generateInvoiceSchema = z.object({
  paymentId: z.string().uuid()
});

export const getFinancialYearInvoicesSchema = z.object({
  financialYear: z.number().int().min(2020).max(2100)
});

// Contract Dispute validators (renamed to avoid conflicts with marketplace disputes)
export const raiseContractDisputeSchema = z.object({
  contractId: z.string().uuid(),
  againstUserId: z.string().uuid(),
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  evidence: z.array(z.object({
    type: z.string(),
    description: z.string(),
    url: z.string().url().optional()
  })).optional()
});

export const submitContractEvidenceSchema = z.object({
  disputeId: z.string().uuid(),
  evidence: z.array(z.object({
    type: z.string(),
    description: z.string(),
    url: z.string().url().optional()
  }))
});

export const resolveContractDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.string().min(20, 'Resolution must be at least 20 characters'),
  engineerPercentage: z.number().min(0).max(100),
  companyPercentage: z.number().min(0).max(100)
}).refine(data => data.engineerPercentage + data.companyPercentage === 100, {
  message: 'Percentages must sum to 100'
});

// Platform Subscription validators (renamed to avoid conflicts with marketplace subscriptions)
export const createPlatformSubscriptionSchema = z.object({
  tier: z.enum([
    'engineer_basic',
    'engineer_pro',
    'engineer_premium',
    'company_starter',
    'company_growth',
    'company_enterprise'
  ]),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual'])
});

export const cancelPlatformSubscriptionSchema = z.object({
  reason: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional()
});

export const upgradePlatformSubscriptionSchema = z.object({
  newTier: z.enum([
    'engineer_basic',
    'engineer_pro',
    'engineer_premium',
    'company_starter',
    'company_growth',
    'company_enterprise'
  ])
});

// Webhook validators
export const razorpayWebhookSchema = z.object({
  payload: z.any(),
  signature: z.string()
});

export const clearTaxWebhookSchema = z.object({
  payload: z.any(),
  signature: z.string().optional()
});

// Fee calculation validators
export const calculateFeeSchema = z.object({
  type: z.enum(['bounty', 'task', 'hourly', 'project', 'marketplace', 'fulltime', 'subscription']),
  amount: z.number().positive(),
  metadata: z.object({
    isSubscription: z.boolean().optional()
  }).optional()
});

// Wallet validators
export const creditWalletSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  paymentId: z.string().uuid().optional()
});

export const debitWalletSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  payoutId: z.string().uuid().optional()
});

export const getTransactionsSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  cursor: z.string().uuid().optional()
});

// Type exports
export type DepositContractEscrowInput = z.infer<typeof depositContractEscrowSchema>;
export type VerifyEscrowPaymentInput = z.infer<typeof verifyEscrowPaymentSchema>;
export type ReleaseMilestoneInput = z.infer<typeof releaseMilestoneSchema>;
export type RefundEscrowInput = z.infer<typeof refundEscrowSchema>;

export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>;

export type SubmitAadhaarInput = z.infer<typeof submitAadhaarSchema>;
export type SubmitPANInput = z.infer<typeof submitPANSchema>;
export type ManuallyVerifyKYCInput = z.infer<typeof manuallyVerifyKYCSchema>;
export type RejectKYCInput = z.infer<typeof rejectKYCSchema>;

export type GenerateInvoiceInput = z.infer<typeof generateInvoiceSchema>;
export type GetFinancialYearInvoicesInput = z.infer<typeof getFinancialYearInvoicesSchema>;

export type RaiseContractDisputeInput = z.infer<typeof raiseContractDisputeSchema>;
export type SubmitContractEvidenceInput = z.infer<typeof submitContractEvidenceSchema>;
export type ResolveContractDisputeInput = z.infer<typeof resolveContractDisputeSchema>;

export type CreatePlatformSubscriptionInput = z.infer<typeof createPlatformSubscriptionSchema>;
export type CancelPlatformSubscriptionInput = z.infer<typeof cancelPlatformSubscriptionSchema>;
export type UpgradePlatformSubscriptionInput = z.infer<typeof upgradePlatformSubscriptionSchema>;

export type RazorpayWebhookInput = z.infer<typeof razorpayWebhookSchema>;
export type ClearTaxWebhookInput = z.infer<typeof clearTaxWebhookSchema>;

export type CalculateFeeInput = z.infer<typeof calculateFeeSchema>;

export type CreditWalletInput = z.infer<typeof creditWalletSchema>;
export type DebitWalletInput = z.infer<typeof debitWalletSchema>;
export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>;
