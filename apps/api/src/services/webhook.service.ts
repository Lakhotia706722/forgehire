import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { getEnv } from "../config/env";
import { PayoutService } from "./payout.service";
import { PlatformSubscriptionService } from "./platform-subscription.service";
import { EscrowService } from "./escrow.service";
import { MarketplacePurchaseService } from "./marketplace-purchase.service";

export class WebhookService {
  private prisma: PrismaClient;
  private razorpayWebhookSecret: string;
  private payoutService: PayoutService;
  private subscriptionService: PlatformSubscriptionService;
  private escrowService: EscrowService;
  private marketplacePurchaseService: MarketplacePurchaseService;

  constructor() {
    this.prisma = new PrismaClient();
    this.razorpayWebhookSecret = getEnv("RAZORPAY_WEBHOOK_SECRET") ?? "";
    this.payoutService = new PayoutService();
    this.subscriptionService = new PlatformSubscriptionService();
    this.escrowService = new EscrowService();
    this.marketplacePurchaseService = new MarketplacePurchaseService();
  }

  /**
   * Handle Razorpay webhook
   * Verifies HMAC signature and processes event
   */
  async handleRazorpayWebhook(data: { payload: any; signature: string }) {
    // Verify HMAC signature
    const isValid = this.verifyRazorpaySignature(
      JSON.stringify(data.payload),
      data.signature,
    );

    if (!isValid) {
      throw new Error("Invalid webhook signature");
    }

    const event = data.payload.event;
    const eventData = data.payload.payload;

    // Generate idempotency key
    const idempotencyKey = this.generateIdempotencyKey(event, eventData);

    // Check if event already processed
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing && existing.processed) {
      return { success: true, message: "Event already processed" };
    }

    // Store webhook event
    const webhookEvent =
      existing ||
      (await this.prisma.webhookEvent.create({
        data: {
          provider: "razorpay",
          eventType: event,
          payload: eventData,
          signature: data.signature,
          verified: true,
          idempotencyKey,
        },
      }));

    try {
      // Process event based on type
      await this.processRazorpayEvent(event, eventData);

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return { success: true, eventType: event };
    } catch (error: any) {
      console.error("Webhook processing error:", error);

      // Mark as failed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          failedAt: new Date(),
          failureReason: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Verify Razorpay webhook signature
   */
  private verifyRazorpaySignature(payload: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac("sha256", this.razorpayWebhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  /**
   * Generate idempotency key for event
   */
  private generateIdempotencyKey(event: string, data: any): string {
    const entityId =
      data.payment?.entity?.id ||
      data.payout?.entity?.id ||
      data.subscription?.entity?.id ||
      data.order?.entity?.id ||
      "unknown";

    return `razorpay_${event}_${entityId}`;
  }

  /**
   * Process Razorpay event
   */
  private async processRazorpayEvent(event: string, data: any) {
    switch (event) {
      // Payment events
      case "payment.captured":
        await this.handlePaymentCaptured(data.payment.entity);
        break;

      case "payment.failed":
        await this.handlePaymentFailed(data.payment.entity);
        break;

      // Payout events
      case "payout.processed":
        await this.handlePayoutProcessed(data.payout.entity);
        break;

      case "payout.failed":
        await this.handlePayoutFailed(data.payout.entity);
        break;

      case "payout.reversed":
        await this.handlePayoutReversed(data.payout.entity);
        break;

      // Subscription events
      case "subscription.charged":
        await this.handleSubscriptionCharged(data.subscription.entity);
        break;

      case "subscription.cancelled":
        await this.handleSubscriptionCancelled(data.subscription.entity);
        break;

      case "subscription.completed":
        await this.handleSubscriptionCompleted(data.subscription.entity);
        break;

      case "subscription.paused":
        await this.handleSubscriptionPaused(data.subscription.entity);
        break;

      case "subscription.resumed":
        await this.handleSubscriptionResumed(data.subscription.entity);
        break;

      // Order events
      case "order.paid":
        await this.handleOrderPaid(data.order.entity);
        break;

      default:
        return;
    }
  }

  /**
   * Handle payment captured event
   */
  private async handlePaymentCaptured(payment: any) {
    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id as string | undefined;

    // Find payment record
    const paymentRecord = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });

    if (paymentRecord) {
      await this.prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: "completed",
          completedAt: new Date(),
        },
      });
    }

    if (razorpayOrderId) {
      await this.marketplacePurchaseService.completePurchaseByOrderId(
        razorpayOrderId,
        razorpayPaymentId,
      );
    }
  }

  /**
   * Handle payment failed event
   */
  private async handlePaymentFailed(payment: any) {
    const razorpayPaymentId = payment.id;

    const paymentRecord = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId },
    });

    if (paymentRecord) {
      await this.prisma.payment.update({
        where: { id: paymentRecord.id },
        data: {
          status: "failed",
          failedAt: new Date(),
          failureReason: payment.error_description || "Payment failed",
        },
      });
    }
  }

  /**
   * Handle payout processed event
   */
  private async handlePayoutProcessed(payout: any) {
    const razorpayPayoutId = payout.id;

    await this.payoutService.completePayout(razorpayPayoutId, payout.utr);
  }

  /**
   * Handle payout failed event
   */
  private async handlePayoutFailed(payout: any) {
    const razorpayPayoutId = payout.id;

    const payoutRecord = await this.prisma.payout.findFirst({
      where: { razorpayPayoutId },
    });

    if (payoutRecord) {
      await this.prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: "failed",
          failedAt: new Date(),
          failureReason: payout.status_details?.description || "Payout failed",
        },
      });
    }
  }

  /**
   * Handle payout reversed event
   */
  private async handlePayoutReversed(payout: any) {
    const razorpayPayoutId = payout.id;

    const payoutRecord = await this.prisma.payout.findFirst({
      where: { razorpayPayoutId },
    });

    if (payoutRecord) {
      await this.prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: "reversed",
          failedAt: new Date(),
          failureReason: "Payout reversed",
        },
      });
    }
  }

  /**
   * Handle subscription charged event
   */
  private async handleSubscriptionCharged(subscription: any) {
    const razorpaySubscriptionId = subscription.id;

    await this.subscriptionService.processBilling(razorpaySubscriptionId);
  }

  /**
   * Handle subscription cancelled event
   */
  private async handleSubscriptionCancelled(subscription: any) {
    const razorpaySubscriptionId = subscription.id;

    const subscriptionRecord = await this.prisma.platformSubscription.findFirst(
      {
        where: { razorpaySubscriptionId },
      },
    );

    if (subscriptionRecord) {
      await this.prisma.platformSubscription.update({
        where: { id: subscriptionRecord.id },
        data: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      });
    }
  }

  /**
   * Handle subscription completed event
   */
  private async handleSubscriptionCompleted(subscription: any) {
    const razorpaySubscriptionId = subscription.id;

    const subscriptionRecord = await this.prisma.platformSubscription.findFirst(
      {
        where: { razorpaySubscriptionId },
      },
    );

    if (subscriptionRecord) {
      await this.prisma.platformSubscription.update({
        where: { id: subscriptionRecord.id },
        data: {
          status: "expired",
        },
      });
    }
  }

  /**
   * Handle subscription paused event
   */
  private async handleSubscriptionPaused(subscription: any) {
    const razorpaySubscriptionId = subscription.id;

    const subscriptionRecord = await this.prisma.platformSubscription.findFirst(
      {
        where: { razorpaySubscriptionId },
      },
    );

    if (subscriptionRecord) {
      await this.prisma.platformSubscription.update({
        where: { id: subscriptionRecord.id },
        data: {
          status: "past_due",
        },
      });
    }
  }

  /**
   * Handle subscription resumed event
   */
  private async handleSubscriptionResumed(subscription: any) {
    const razorpaySubscriptionId = subscription.id;

    await this.subscriptionService.reactivateSubscription(
      razorpaySubscriptionId,
    );
  }

  /**
   * Handle order paid event
   */
  private async handleOrderPaid(order: any) {
    const razorpayOrderId = order.id;

    // Find payment record
    const paymentRecord = await this.prisma.payment.findFirst({
      where: { razorpayOrderId },
    });

    if (paymentRecord && paymentRecord.type === "escrow_deposit") {
      return;
    }
  }

  /**
   * Handle ClearTax webhook
   */
  async handleClearTaxWebhook(data: { payload: any; signature?: string }) {
    const event = data.payload.event;
    const eventData = data.payload.data;

    // Generate idempotency key
    const idempotencyKey = `cleartax_${event}_${eventData.invoice_id || Date.now()}`;

    // Check if event already processed
    const existing = await this.prisma.webhookEvent.findUnique({
      where: { idempotencyKey },
    });

    if (existing && existing.processed) {
      return { success: true, message: "Event already processed" };
    }

    // Store webhook event
    const webhookEvent =
      existing ||
      (await this.prisma.webhookEvent.create({
        data: {
          provider: "cleartax",
          eventType: event,
          payload: eventData,
          signature: data.signature,
          verified: true,
          idempotencyKey,
        },
      }));

    try {
      // Process ClearTax event
      await this.processClearTaxEvent(event, eventData);

      // Mark as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          processed: true,
          processedAt: new Date(),
        },
      });

      return { success: true, eventType: event };
    } catch (error: any) {
      console.error("ClearTax webhook processing error:", error);

      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          failedAt: new Date(),
          failureReason: error.message,
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * Process ClearTax event
   */
  private async processClearTaxEvent(event: string, data: any) {
    switch (event) {
      case "invoice.generated":
        await this.handleInvoiceGenerated(data);
        break;

      case "invoice.failed":
        await this.handleInvoiceFailed(data);
        break;

      default:
        return;
    }
  }

  /**
   * Handle invoice generated event
   */
  private async handleInvoiceGenerated(data: any) {
    const clearTaxId = data.invoice_id;

    // Find invoice by ClearTax ID
    const invoice = await this.prisma.invoice.findFirst({
      where: { clearTaxId },
    });

    if (invoice) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          clearTaxStatus: "generated",
          pdfUrl: data.pdf_url,
        },
      });
    }
  }

  /**
   * Handle invoice failed event
   */
  private async handleInvoiceFailed(data: any) {
    const clearTaxId = data.invoice_id;

    const invoice = await this.prisma.invoice.findFirst({
      where: { clearTaxId },
    });

    if (invoice) {
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          clearTaxStatus: "failed",
        },
      });
    }
  }

  /**
   * Retry failed webhook events
   */
  async retryFailedEvents(maxRetries = 3) {
    const failedEvents = await this.prisma.webhookEvent.findMany({
      where: {
        processed: false,
        retryCount: {
          lt: maxRetries,
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const results = [];

    for (const event of failedEvents) {
      try {
        await this.processRazorpayEvent(event.eventType, event.payload);

        await this.prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            processed: true,
            processedAt: new Date(),
          },
        });

        results.push({ eventId: event.id, success: true });
      } catch (error: any) {
        await this.prisma.webhookEvent.update({
          where: { id: event.id },
          data: {
            retryCount: { increment: 1 },
            failureReason: error.message,
          },
        });

        results.push({
          eventId: event.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(eventId: string) {
    return await this.prisma.webhookEvent.findUnique({
      where: { id: eventId },
    });
  }

  /**
   * Get webhook events
   */
  async getWebhookEvents(filters?: {
    provider?: string;
    eventType?: string;
    processed?: boolean;
    limit?: number;
  }) {
    const limit = filters?.limit || 50;

    return await this.prisma.webhookEvent.findMany({
      where: {
        provider: filters?.provider,
        eventType: filters?.eventType,
        processed: filters?.processed,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
