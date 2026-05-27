import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ContractService } from "../services/contract.service";
import {
  authenticate,
  requireCompany,
  requireEngineerOrCompany,
} from "../middleware/auth";
import { successResponse } from "@neuronhire/shared";
import { z } from "zod";
import { HiringMode } from "@prisma/client";

const createContractSchema = z.object({
  jobPostingId: z.string().uuid().optional(),
  engineerProfileId: z.string().uuid(),
  engineerUserId: z.string().uuid(),
  hiringMode: z.nativeEnum(HiringMode),
  title: z.string().min(1).max(200),
  scope: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().optional(),
  rate: z.number().positive(),
  currency: z.string().default("INR"),
  ctc: z.number().positive().optional(),
  stipendAmount: z.number().positive().optional(),
  durationMonths: z.number().positive().optional(),
  hourlyRate: z.number().positive().optional(),
  estimatedHours: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  milestones: z.array(z.any()).optional(),
  ipOwnership: z.string().optional(),
  ndaRequired: z.boolean().optional(),
  confidentialityTerms: z.string().optional(),
  trialMode: z.boolean().optional(),
});

const signContractSchema = z.object({
  signature: z.string().min(1),
});

const amendmentSchema = z.object({
  reason: z.string().min(1),
  changes: z.record(z.any()),
});

export async function contractRoutes(fastify: FastifyInstance): Promise<void> {
  const contractService = new ContractService();

  // Create contract
  fastify.post(
    "/contracts",
    { preHandler: [authenticate, requireCompany] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const body = createContractSchema.parse(request.body);

      const prisma = (contractService as any).prisma;
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { userId: user.id },
      });

      if (!companyProfile) {
        return reply
          .code(404)
          .send({ success: false, error: "Company profile not found" });
      }

      const contract = await contractService.createContract({
        ...body,
        companyProfileId: companyProfile.id,
        companyUserId: user.id,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      });

      return reply.code(201).send(successResponse(contract));
    },
  );

  // Get all my contracts
  fastify.get(
    "/contracts",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { hiringMode, status, role } = request.query as any;

      const contracts = await contractService.getUserContracts(user.id, {
        hiringMode,
        status,
        role,
      });

      return successResponse(contracts);
    },
  );

  // Get contract by ID
  fastify.get(
    "/contracts/:id",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      const contract = await contractService.getContract(id, user.id);
      return successResponse(contract);
    },
  );

  // Sign contract
  fastify.post(
    "/contracts/:id/sign",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const body = signContractSchema.parse(request.body);
      const ipAddress = request.ip || "0.0.0.0";

      const contract = await contractService.signContract(
        id,
        user.id,
        body.signature,
        ipAddress,
      );
      return successResponse(contract);
    },
  );

  // Submit milestone
  fastify.post(
    "/contracts/:id/milestone/:mid/submit",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { mid } = request.params as any;
      const { deliverables, notes } = request.body as any;
      const prisma = (contractService as any).prisma;

      const milestone = await prisma.milestonePayment.update({
        where: { id: mid },
        data: {
          status: "submitted",
          submittedAt: new Date(),
          deliverables: deliverables || undefined,
          notes,
        },
      });

      return successResponse(milestone);
    },
  );

  // Approve milestone
  fastify.post(
    "/contracts/:id/milestone/:mid/approve",
    { preHandler: [authenticate, requireCompany] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { mid } = request.params as any;
      const prisma = (contractService as any).prisma;

      const milestone = await prisma.milestonePayment.update({
        where: { id: mid },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
      });

      return successResponse(milestone);
    },
  );

  // Create amendment
  fastify.post(
    "/contracts/:id/amendment",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const body = amendmentSchema.parse(request.body);

      const amendment = await contractService.createAmendment(
        id,
        user.id,
        body,
      );
      return reply.code(201).send(successResponse(amendment));
    },
  );

  // Get contract document URL
  fastify.get(
    "/contracts/:id/document",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;

      const contract = await contractService.getContract(id, user.id);

      return successResponse({
        contractPdfUrl: contract.contractPdfUrl,
        finalContractUrl: contract.finalContractUrl,
      });
    },
  );

  // Raise dispute on contract
  fastify.post(
    "/contracts/:id/dispute",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      const { id } = request.params as any;
      const { reason, evidence } = request.body as any;
      const prisma = (contractService as any).prisma;

      const contract = await contractService.getContract(id, user.id);

      const dispute = await prisma.contractDispute.create({
        data: {
          contractId: id,
          raisedByUserId: user.id,
          reason,
          evidence: evidence || undefined,
          status: "open",
        },
      });

      return reply.code(201).send(successResponse(dispute));
    },
  );
}
