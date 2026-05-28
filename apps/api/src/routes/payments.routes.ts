import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { WalletService } from "../services/wallet.service";
import { PayoutService } from "../services/payout.service";
import { InvoiceService } from "../services/invoice.service";
import { WebhookService } from "../services/webhook.service";
import { EscrowService } from "../services/escrow.service";
import { MilestonePaymentService } from "../services/milestone-payment.service";
import { authenticate } from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { z } from "zod";
import { PayoutMethod } from "@prisma/client";

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
  const escrowService = new EscrowService();
  const milestonePaymentService = new MilestonePaymentService();
  const prisma = (walletService as any).prisma;

  // Get wallet balance + stats
  fastify.get(
    "/payments/wallet",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const stats = await walletService.getWalletStats(user.id);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthCredits = await prisma.walletTransaction.aggregate({
        where: {
          wallet: { userId: user.id },
          type: "credit",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      });

      const pendingMilestones = await prisma.milestonePayment.aggregate({
        where: {
          contract: {
            engineerProfile: { userId: user.id },
          },
          status: { in: ["submitted", "approved"] },
        },
        _sum: { amount: true },
      });

      const kyc = await prisma.kYCVerification.findUnique({
        where: { userId: user.id },
      });
      const kycThreshold = 50000;
      const requiresKycForWithdrawal =
        Number(stats.totalEarned) > kycThreshold &&
        (!kyc || kyc.status !== "verified" || !kyc.panVerified);

      return successResponse({
        ...stats,
        pendingRelease: Number(pendingMilestones._sum.amount ?? 0),
        thisMonthEarnings: Number(monthCredits._sum.amount ?? 0),
        kycStatus: kyc?.status ?? "not_started",
        panVerified: Boolean(kyc?.panVerified),
        requiresKycForWithdrawal,
        kycThreshold,
        minimumPayout: 500,
      });
    },
  );

  // Get wallet earnings chart data
  fastify.get(
    "/payments/wallet/earnings",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const { period = "6months" } = request.query as any;

      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      });
      if (!wallet) return successResponse([]);

      const now = new Date();
      let startDate: Date;
      let groupBy: "day" | "month";

      if (period === "30days") {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = "day";
      } else if (period === "year") {
        startDate = new Date(now.getFullYear(), 0, 1);
        groupBy = "month";
      } else {
        // 6months default
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        groupBy = "month";
      }

      const transactions = await prisma.walletTransaction.findMany({
        where: {
          walletId: wallet.id,
          type: "credit",
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "asc" },
      });

      // Group by period
      const grouped: Record<
        string,
        {
          contracts: number;
          bounties: number;
          marketplace: number;
          total: number;
        }
      > = {};

      transactions.forEach((tx: any) => {
        const d = new Date(tx.createdAt);
        const key =
          groupBy === "month"
            ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

        if (!grouped[key])
          grouped[key] = {
            contracts: 0,
            bounties: 0,
            marketplace: 0,
            total: 0,
          };

        const amount = Number(tx.amount);
        grouped[key].total += amount;

        const desc = tx.description.toLowerCase();
        if (desc.includes("contract") || desc.includes("milestone")) {
          grouped[key].contracts += amount;
        } else if (desc.includes("bounty") || desc.includes("task")) {
          grouped[key].bounties += amount;
        } else if (desc.includes("product") || desc.includes("marketplace")) {
          grouped[key].marketplace += amount;
        } else {
          grouped[key].contracts += amount;
        }
      });

      const result = Object.entries(grouped).map(([date, data]) => ({
        date,
        ...data,
      }));
      return successResponse(result);
    },
  );

  // Get wallet transactions (paginated)
  fastify.get(
    "/payments/wallet/transactions",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const { limit = "20", cursor } = request.query as any;

      const wallet = await prisma.wallet.findUnique({
        where: { userId: user.id },
      });
      if (!wallet)
        return successResponse({ transactions: [], nextCursor: null });

      const take = parseInt(limit);
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          walletId: wallet.id,
          ...(cursor ? { id: { lt: cursor } } : {}),
        },
        orderBy: { createdAt: "desc" },
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
    },
  );

  const requestPayoutHandler = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
      const user = (request as any).user;
      const body = payoutRequestSchema.parse(request.body);

      const engineerProfile = await prisma.engineerProfile.findUnique({
        where: { userId: user.id },
      });
      if (!engineerProfile)
        return reply
          .code(400)
          .send({ success: false, error: "Engineer profile required" });

      const payout = await payoutService.requestPayout({
        userId: user.id,
        engineerProfileId: engineerProfile.id,
        amount: body.amount,
        method: body.method,
        upiId: body.upiId,
        accountNumber: body.accountNumber,
        ifscCode: body.ifscCode,
        accountHolderName: body.accountHolderName,
      });

      return reply.code(201).send(successResponse(payout));
    };

  // Withdraw (legacy alias)
  fastify.post(
    "/payments/withdraw",
    { preHandler: [authenticate] },
    requestPayoutHandler,
  );

  // Payout request (canonical route)
  fastify.post(
    "/payments/payout",
    { preHandler: [authenticate] },
    requestPayoutHandler,
  );

  // Create escrow order (canonical route)
  fastify.post(
    "/payments/escrow",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const body = z
        .object({
          contractId: z.string().uuid().optional(),
          taskId: z.string().uuid().optional(),
          amount: z.number().positive(),
          currency: z.string().default("INR"),
        })
        .parse(request.body);
      const escrow = await escrowService.depositEscrow({
        contractId: body.contractId,
        taskId: body.taskId,
        userId: user.id,
        amount: body.amount,
        currency: body.currency,
      });
      return successResponse(escrow);
    },
  );

  // Release milestone payment (canonical route)
  fastify.post(
    "/payments/release/:milestoneId",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const { milestoneId } = request.params as { milestoneId: string };
      const body = z
        .object({
          approvalNotes: z.string().max(1000).optional(),
        })
        .parse((request.body as object) ?? {});
      const milestone = await milestonePaymentService.approveMilestone(
        milestoneId,
        user.id,
        body.approvalNotes,
      );
      return successResponse(milestone);
    },
  );

  // Get invoice
  fastify.get(
    "/payments/invoice/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const invoice = await invoiceService.getInvoice(id, user.id);
      return successResponse(invoice);
    },
  );

  // Razorpay webhook
  fastify.post(
    "/payments/webhook",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers["x-razorpay-signature"] as string;
      const body = request.body as any;

      try {
        await webhookService.handleRazorpayWebhook({
          payload: body,
          signature,
        });
        return reply.code(200).send({ status: "ok" });
      } catch (error: any) {
        return reply.code(400).send({ error: error.message });
      }
    },
  );
}
