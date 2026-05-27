import { z } from 'zod';

// Product Creation Validators
export const createProductSchema = z.object({
  name: z.string().min(5, 'Product name must be at least 5 characters').max(100),
  tagline: z.string().min(10, 'Tagline must be at least 10 characters').max(200),
  category: z.enum([
    'ai_agents',
    'fine_tuned_models',
    'saas_tools',
    'automation_workflows',
    'datasets_prompts',
    'apis_microservices'
  ]),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(10),
  thumbnailUrl: z.string().url('Invalid thumbnail URL'),
  description: z.string().min(100, 'Description must be at least 100 characters').max(10000),
  demoUrl: z.string().url('Demo URL is required and must be valid'),
  screenshots: z.array(z.string().url()).min(3, 'Minimum 3 screenshots required').max(10),
  
  techStack: z.array(z.string()).min(1, 'At least one technology is required'),
  aiModelUsed: z.string().optional().nullable(),
  architectureType: z.string().optional().nullable(),
  
  pricingModel: z.enum(['one_time', 'subscription', 'freemium', 'per_call']),
  priceINR: z.number().min(100, 'Price must be at least ₹100').optional().nullable(),
  priceUSD: z.number().min(1, 'Price must be at least $1').optional().nullable(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    included: z.boolean().default(true)
  })).min(1, 'At least one feature is required'),
  
  performanceMetrics: z.record(z.any()).optional().nullable(),
  deliveryType: z.string().min(1, 'Delivery type is required'),
  customizationAvailable: z.boolean().default(false),
  supportType: z.string().optional().nullable(),
  supportDuration: z.string().optional().nullable()
}).refine(
  (data) => {
    // At least one price must be set
    return data.priceINR || data.priceUSD;
  },
  { message: 'At least one price (INR or USD) must be set' }
);

export const updateProductSchema = z.object({
  name: z.string().min(5).max(100).optional(),
  tagline: z.string().min(10).max(200).optional(),
  category: z.enum([
    'ai_agents',
    'fine_tuned_models',
    'saas_tools',
    'automation_workflows',
    'datasets_prompts',
    'apis_microservices'
  ]).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  thumbnailUrl: z.string().url().optional(),
  description: z.string().min(100).max(10000).optional(),
  demoUrl: z.string().url().optional(),
  screenshots: z.array(z.string().url()).min(3).max(10).optional(),
  techStack: z.array(z.string()).min(1).optional(),
  aiModelUsed: z.string().optional().nullable(),
  architectureType: z.string().optional().nullable(),
  pricingModel: z.enum(['one_time', 'subscription', 'freemium', 'per_call']).optional(),
  priceINR: z.number().min(100).optional().nullable(),
  priceUSD: z.number().min(1).optional().nullable(),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
    included: z.boolean().default(true)
  })).min(1).optional(),
  performanceMetrics: z.record(z.any()).optional().nullable(),
  deliveryType: z.string().min(1).optional(),
  customizationAvailable: z.boolean().optional(),
  supportType: z.string().optional().nullable(),
  supportDuration: z.string().optional().nullable()
});

export const publishProductSchema = z.object({
  productId: z.string().uuid()
});

// Purchase Validators
export const purchaseProductSchema = z.object({
  productId: z.string().uuid(),
  currency: z.enum(['INR', 'USD']).default('INR'),
  referralCode: z.string().optional().nullable()
});

export const completePurchaseSchema = z.object({
  purchaseId: z.string().uuid(),
  paymentId: z.string().min(1, 'Payment ID is required'),
  signature: z.string().min(1, 'Signature is required')
});

// Review Validators
export const createReviewSchema = z.object({
  purchaseId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100).optional().nullable(),
  review: z.string().min(20, 'Review must be at least 20 characters').max(2000),
  pros: z.array(z.string()).max(5).optional(),
  cons: z.array(z.string()).max(5).optional()
});

// Dispute Validators
export const raiseDisputeSchema = z.object({
  purchaseId: z.string().uuid(),
  reason: z.string().min(50, 'Reason must be at least 50 characters').max(2000),
  evidence: z.record(z.any()).optional().nullable()
});

export const resolveDisputeSchema = z.object({
  disputeId: z.string().uuid(),
  resolution: z.enum(['buyer', 'seller']),
  resolutionNotes: z.string().min(20, 'Resolution notes must be at least 20 characters').max(2000),
  refundAmount: z.number().min(0).optional().nullable()
});

// Bundle Validators
export const createBundleSchema = z.object({
  name: z.string().min(5, 'Bundle name must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional().nullable(),
  productIds: z.array(z.string().uuid()).min(2, 'Bundle must contain at least 2 products').max(10),
  bundlePrice: z.number().min(100, 'Bundle price must be at least ₹100'),
  currency: z.string().default('INR')
});

export const updateBundleSchema = z.object({
  name: z.string().min(5).max(100).optional(),
  description: z.string().min(20).max(1000).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  productIds: z.array(z.string().uuid()).min(2).max(10).optional(),
  bundlePrice: z.number().min(100).optional(),
  active: z.boolean().optional()
});

// Subscription Validators
export const createSubscriptionSchema = z.object({
  purchaseId: z.string().uuid(),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly'])
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  reason: z.string().min(10, 'Cancellation reason must be at least 10 characters').max(500).optional().nullable()
});

// Search & Filter Validators
export const productSearchSchema = z.object({
  // Filters
  category: z.enum([
    'ai_agents',
    'fine_tuned_models',
    'saas_tools',
    'automation_workflows',
    'datasets_prompts',
    'apis_microservices'
  ]).optional(),
  pricingModel: z.enum(['one_time', 'subscription', 'freemium', 'per_call']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  aiModel: z.string().optional(),
  industry: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  hasDemo: z.boolean().optional(),
  
  // Search
  query: z.string().optional(),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'publishedAt', 'priceINR', 'rating', 'purchaseCount', 'viewCount']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  // Pagination
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
}).refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'Min price must be less than or equal to max price' }
);

// Analytics Validators
export const analyticsQuerySchema = z.object({
  productId: z.string().uuid(),
  period: z.enum(['week', 'month', 'year', 'all']).default('month')
});

export const salesByPeriodSchema = z.object({
  productId: z.string().uuid(),
  groupBy: z.enum(['day', 'week', 'month']).default('day')
});

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type PublishProductInput = z.infer<typeof publishProductSchema>;
export type PurchaseProductInput = z.infer<typeof purchaseProductSchema>;
export type CompletePurchaseInput = z.infer<typeof completePurchaseSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type RaiseDisputeInput = z.infer<typeof raiseDisputeSchema>;
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;
export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type UpdateBundleInput = z.infer<typeof updateBundleSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof cancelSubscriptionSchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type SalesByPeriodInput = z.infer<typeof salesByPeriodSchema>;
