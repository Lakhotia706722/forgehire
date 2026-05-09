import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service';
import { MarketplacePurchaseService } from '../services/marketplace-purchase.service';
import { MarketplacePayoutService } from '../services/marketplace-payout.service';
import { SubscriptionService } from '../services/subscription.service';
import { DisputeService } from '../services/dispute.service';
import { BundleService } from '../services/bundle.service';
import { ReferralService } from '../services/referral.service';
import { ProductAnalyticsService } from '../services/product-analytics.service';
import { ProductRecommendationService } from '../services/product-recommendation.service';
import { ProductReviewService } from '../services/product-review.service';
import { authenticate, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';
import {
  createProductSchema,
  updateProductSchema,
  purchaseProductSchema,
  completePurchaseSchema,
  createReviewSchema,
  raiseDisputeSchema,
  resolveDisputeSchema,
  createBundleSchema,
  updateBundleSchema,
  createSubscriptionSchema,
  cancelSubscriptionSchema,
  productSearchSchema,
  analyticsQuerySchema
} from '@neuronhire/shared';

export async function productRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();
  const purchaseService = new MarketplacePurchaseService();
  const payoutService = new MarketplacePayoutService();
  const subscriptionService = new SubscriptionService();
  const disputeService = new DisputeService();
  const bundleService = new BundleService();
  const referralService = new ReferralService();
  const analyticsService = new ProductAnalyticsService();
  const recommendationService = new ProductRecommendationService();
  const reviewService = new ProductReviewService();

  // ========== PRODUCT LISTING ==========

  // Create product
  fastify.post(
    '/products',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = createProductSchema.parse((request.body as any));

        const product = await productService.createProduct(userId, data);

        return reply.code(201).send({
          success: true,
          data: product,
          message: 'Product created successfully in draft status'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Update product
  fastify.put(
    '/products/:id',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = updateProductSchema.parse((request.body as any));

        const product = await productService.updateProduct(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: product,
          message: 'Product updated successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Publish product (submit for moderation)
  fastify.post(
    '/products/:id/publish',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const product = await productService.publishProduct(id, userId, { productId: id });

        return reply.code(200).send({
          success: true,
          data: product,
          message: 'Product published successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get product feed
  fastify.get(
    '/products',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const filters = productSearchSchema.parse((request.query as any));
        const result = await productService.getProductFeed(filters);

        return reply.code(200).send({
          success: true,
          data: result.items,
          meta: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
          }
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get product by ID or slug
  fastify.get(
    '/products/:identifier',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { identifier } = (request.params as any);
        const userId = (request as any).user?.userId;

        const product = await productService.getProduct(identifier, userId);

        return reply.code(200).send({
          success: true,
          data: product
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== PURCHASE & ACCESS ==========

  // Create purchase order
  fastify.post(
    '/products/:id/purchase',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const body = (request.body as any) as any;
        const data = purchaseProductSchema.parse({ ...body, productId: id });

        const order = await purchaseService.createPurchaseOrder(userId, data);

        return reply.code(200).send({
          success: true,
          data: order,
          message: 'Purchase order created. Complete payment to get access.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Complete purchase
  fastify.post(
    '/purchases/:id/complete',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const body = (request.body as any) as any;
        const data = completePurchaseSchema.parse({ ...body, purchaseId: id });

        const purchase = await purchaseService.completePurchase(id, {
          paymentId: data.paymentId,
          signature: data.signature
        });

        return reply.code(200).send({
          success: true,
          data: purchase,
          message: 'Purchase completed successfully. Access granted!'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get buyer's purchases
  fastify.get(
    '/purchases/my',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const purchases = await purchaseService.getBuyerPurchases(userId);

        return reply.code(200).send({
          success: true,
          data: purchases
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get purchase by ID
  fastify.get(
    '/purchases/:id',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const purchase = await purchaseService.getPurchase(id, userId);

        return reply.code(200).send({
          success: true,
          data: purchase
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Revoke license
  fastify.post(
    '/purchases/:id/revoke',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const purchase = await purchaseService.revokeLicense(id, userId);

        return reply.code(200).send({
          success: true,
          data: purchase,
          message: 'License revoked successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== SUBSCRIPTIONS ==========

  // Create subscription
  fastify.post(
    '/subscriptions',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const data = createSubscriptionSchema.parse((request.body as any));
        const subscription = await subscriptionService.createSubscription(
          data.purchaseId,
          data.billingCycle
        );

        return reply.code(201).send({
          success: true,
          data: subscription,
          message: 'Subscription created successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Cancel subscription
  fastify.post(
    '/subscriptions/:id/cancel',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const body = (request.body as any) as any;
        const data = cancelSubscriptionSchema.parse({ ...body, subscriptionId: id });

        const subscription = await subscriptionService.cancelSubscription(
          id,
          userId,
          data.reason || undefined
        );

        return reply.code(200).send({
          success: true,
          data: subscription,
          message: 'Subscription cancelled successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get buyer's subscriptions
  fastify.get(
    '/subscriptions/my',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const subscriptions = await subscriptionService.getBuyerSubscriptions(userId);

        return reply.code(200).send({
          success: true,
          data: subscriptions
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== DISPUTES ==========

  // Raise dispute
  fastify.post(
    '/disputes',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = raiseDisputeSchema.parse((request.body as any));

        const dispute = await disputeService.raiseDispute(data.purchaseId, userId, data);

        return reply.code(201).send({
          success: true,
          data: dispute,
          message: 'Dispute raised successfully. Our team will review it.'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get buyer's disputes
  fastify.get(
    '/disputes/my',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const disputes = await disputeService.getBuyerDisputes(userId);

        return reply.code(200).send({
          success: true,
          data: disputes
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get dispute by ID
  fastify.get(
    '/disputes/:id',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const dispute = await disputeService.getDispute(id, userId);

        return reply.code(200).send({
          success: true,
          data: dispute
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Resolve dispute (admin only)
  fastify.post(
    '/disputes/:id/resolve',
    {
      preHandler: [authenticate, requireRole(UserRole.admin)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const body = (request.body as any) as any;
        const data = resolveDisputeSchema.parse({ ...body, disputeId: id });

        const dispute = await disputeService.resolveDispute(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: dispute,
          message: 'Dispute resolved successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== BUNDLES ==========

  // Create bundle
  fastify.post(
    '/bundles',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = createBundleSchema.parse((request.body as any));

        const bundle = await bundleService.createBundle(userId, data);

        return reply.code(201).send({
          success: true,
          data: bundle,
          message: 'Bundle created successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Update bundle
  fastify.put(
    '/bundles/:id',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const data = updateBundleSchema.parse((request.body as any));

        const bundle = await bundleService.updateBundle(id, userId, data);

        return reply.code(200).send({
          success: true,
          data: bundle,
          message: 'Bundle updated successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get bundle by ID
  fastify.get(
    '/bundles/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const bundle = await bundleService.getBundle(id);

        return reply.code(200).send({
          success: true,
          data: bundle
        });
      } catch (error: any) {
        return reply.code(404).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get active bundles
  fastify.get(
    '/bundles',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const bundles = await bundleService.getActiveBundles();

        return reply.code(200).send({
          success: true,
          data: bundles
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Delete bundle
  fastify.delete(
    '/bundles/:id',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        await bundleService.deleteBundle(id, userId);

        return reply.code(200).send({
          success: true,
          message: 'Bundle deleted successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== REFERRALS ==========

  // Generate referral link
  fastify.post(
    '/referrals',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const body = (request.body as any) as any;
        const productId = body.productId;

        const referralLink = await referralService.generateReferralLink(userId, productId);

        return reply.code(201).send({
          success: true,
          data: referralLink,
          message: 'Referral link generated successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get user's referral links
  fastify.get(
    '/referrals/my',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const referralLinks = await referralService.getUserReferralLinks(userId);

        return reply.code(200).send({
          success: true,
          data: referralLinks
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get referral stats
  fastify.get(
    '/referrals/stats',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const stats = await referralService.getReferralStats(userId);

        return reply.code(200).send({
          success: true,
          data: stats
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== REVIEWS ==========

  // Create review
  fastify.post(
    '/reviews',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const data = createReviewSchema.parse((request.body as any));

        const review = await reviewService.createReview(userId, data);

        return reply.code(201).send({
          success: true,
          data: review,
          message: 'Review submitted successfully'
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get product reviews
  fastify.get(
    '/products/:id/reviews',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const filters = (request.query as any);

        const result = await reviewService.getProductReviews(id, filters);

        return reply.code(200).send({
          success: true,
          data: result.items,
          meta: {
            nextCursor: result.nextCursor,
            hasMore: result.hasMore
          }
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get rating summary
  fastify.get(
    '/products/:id/rating-summary',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const summary = await reviewService.getRatingSummary(id);

        return reply.code(200).send({
          success: true,
          data: summary
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Mark review as helpful
  fastify.post(
    '/reviews/:id/helpful',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);

        const review = await reviewService.markHelpful(id, userId);

        return reply.code(200).send({
          success: true,
          data: review
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== ANALYTICS ==========

  // Get product analytics
  fastify.get(
    '/products/:id/analytics',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const { id } = (request.params as any);
        const query = analyticsQuerySchema.parse({ ...(request.query as any), productId: id });

        const analytics = await analyticsService.getProductAnalytics(id, userId, query.period);

        return reply.code(200).send({
          success: true,
          data: analytics
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get engineer dashboard
  fastify.get(
    '/analytics/dashboard',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const dashboard = await analyticsService.getEngineerDashboard(userId);

        return reply.code(200).send({
          success: true,
          data: dashboard
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get engineer earnings
  fastify.get(
    '/analytics/earnings',
    {
      preHandler: [authenticate, requireRole(UserRole.engineer)]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const earnings = await payoutService.getEngineerEarnings(userId);

        return reply.code(200).send({
          success: true,
          data: earnings
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // ========== RECOMMENDATIONS ==========

  // Get AI recommendations
  fastify.get(
    '/recommendations',
    {
      preHandler: [authenticate]
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = (request as any).user.userId;
        const limit = (request.query as any).limit || 10;

        const recommendations = await recommendationService.getRecommendations(userId, limit);

        return reply.code(200).send({
          success: true,
          data: recommendations
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get similar products
  fastify.get(
    '/products/:id/similar',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = (request.params as any);
        const limit = (request.query as any).limit || 5;

        const similar = await recommendationService.getSimilarProducts(id, limit);

        return reply.code(200).send({
          success: true,
          data: similar
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );

  // Get trending products
  fastify.get(
    '/products/trending',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const limit = (request.query as any).limit || 10;
        const trending = await recommendationService.getTrendingProducts(limit);

        return reply.code(200).send({
          success: true,
          data: trending
        });
      } catch (error: any) {
        return reply.code(400).send({
          success: false,
          error: error.message
        });
      }
    }
  );
}



