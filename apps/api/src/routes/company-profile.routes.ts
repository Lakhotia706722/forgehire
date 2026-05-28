import { FastifyInstance } from "fastify";
import { CompanyProfileService } from "../services/company-profile.service";
import { S3UploadService } from "../services/s3-upload.service";
import { successResponse } from "@neuronhire/shared";
import { authenticate, requireCompany } from "../middleware/auth";
import { companyProfileSchema, companyHiringSchema } from "@neuronhire/shared";
import { z } from "zod";

export async function companyProfileRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const profileService = new CompanyProfileService();
  const s3Service = new S3UploadService();
  const onboardingBasicSchema = z.object({
    companyName: z.string().min(2),
    logo: z.string().url().optional().nullable(),
    website: z.string().url().optional().nullable(),
    industry: z.string().min(1),
    companySize: z.string().min(1),
    foundedYear: z.number().int().min(1800).max(new Date().getFullYear()),
    description: z.string().min(10),
  });
  const onboardingContactSchema = z.object({
    contactName: z.string().min(2),
    contactRole: z.string().min(2),
    contactPhone: z.string().min(7),
    contactEmail: z.string().email(),
  });
  const onboardingIntentSchema = z.object({
    hiringIntent: z
      .array(
        z.enum(["full_time", "internship", "hourly", "project", "bounty"]),
      )
      .min(1),
    primaryAIDomains: z
      .array(
        z.enum([
          "chatbots",
          "automation",
          "agents",
          "data",
          "vision",
          "nlp",
          "mlops",
          "fine_tuning",
          "rag",
        ]),
      )
      .min(1),
  });
  const onboardingBudgetSchema = z.object({
    budgetRange: z.enum([
      "under_1l",
      "1l_10l",
      "10l_1cr",
      "above_1cr",
    ]),
    preferredPayment: z.enum(["fixed", "hourly", "both"]),
    billingMethod: z.enum(["card", "upi", "neft"]),
  });
  const onboardingCompleteSchema = z.object({
    gstNumber: z
      .string()
      .regex(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        "Invalid GST format",
      )
      .optional()
      .nullable(),
    linkedinCompanyPage: z.string().url().optional().nullable(),
  });

  // Public profile by ID
  fastify.get(
    "/profiles/:id",
    async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const profile = await profileService.getPublicProfileById(id);
      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Company not found" });
      }
      const trustScore = await profileService.calculateTrustScore(profile.id);
      profile.trustScore = trustScore;
      return successResponse(profile);
    },
  );

  // Get profile
  fastify.get(
    "/profile",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getFullProfile(request.user.userId);
      return successResponse(profile);
    },
  );

  // Update profile
  fastify.post(
    "/profile",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const body = companyProfileSchema.parse(request.body);
      const profile = await profileService.updateProfile(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Onboarding Step 1: basic
  fastify.put(
    "/profile/basic",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any) => {
      const body = onboardingBasicSchema.parse(request.body);
      const profile = await profileService.updateProfile(request.user.userId, {
        companyName: body.companyName,
        logoUrl: body.logo ?? null,
        website: body.website ?? null,
        industry: body.industry,
        size: body.companySize,
        foundedYear: body.foundedYear,
        description: body.description,
        location: null,
        gstNumber: null,
      });
      return successResponse(profile);
    },
  );

  // Onboarding Step 2: contact (validated; email must match account)
  fastify.put(
    "/profile/contact",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, reply) => {
      const user = request.user;
      const body = onboardingContactSchema.parse(request.body);
      if (body.contactEmail.toLowerCase() !== user.email.toLowerCase()) {
        return reply.code(400).send({
          success: false,
          error: "Contact email must match verified account email",
        });
      }
      return successResponse({
        contactName: body.contactName,
        contactRole: body.contactRole,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail,
      });
    },
  );

  // Onboarding Step 3: hiring intent
  fastify.put(
    "/profile/intent",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any) => {
      const body = onboardingIntentSchema.parse(request.body);
      const profile = await profileService.updateHiringStatus(request.user.userId, {
        isHiring: true,
        hiringIntents: body.hiringIntent.map((v) =>
          v === "hourly" ? "freelance" : v,
        ) as Array<"full_time" | "freelance" | "project" | "bounty">,
        aiRequirements: body.primaryAIDomains
          .map((v) => (v === "fine_tuning" || v === "rag" ? "nlp" : v))
          .filter(
            (
              v,
            ): v is
              | "chatbots"
              | "automation"
              | "agents"
              | "data"
              | "vision"
              | "nlp"
              | "mlops" =>
              [
                "chatbots",
                "automation",
                "agents",
                "data",
                "vision",
                "nlp",
                "mlops",
              ].includes(v),
          ),
      });
      return successResponse(profile);
    },
  );

  // Onboarding Step 4: budget & payment preference
  fastify.put(
    "/profile/budget",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any) => {
      const body = onboardingBudgetSchema.parse(request.body);
      return successResponse(body);
    },
  );

  // Onboarding Step 5: domain verification status
  fastify.get(
    "/verify-domain",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, reply) => {
      const { domain } = request.query as { domain?: string };
      if (!domain) {
        return reply
          .code(400)
          .send({ success: false, error: "domain query param is required" });
      }
      const profile = await profileService.getOrCreateProfile(request.user.userId);
      let verified = false;
      if (profile.website) {
        try {
          verified = new URL(profile.website).hostname.includes(
            domain.replace(/^www\./, ""),
          );
        } catch {
          verified = false;
        }
      }
      return successResponse({ domain, verified });
    },
  );

  // Onboarding completion
  fastify.post(
    "/profile/complete",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, reply) => {
      const body = onboardingCompleteSchema.parse(request.body ?? {});
      const profile = await profileService.getOrCreateProfile(request.user.userId);
      const hasBasic =
        Boolean(profile.companyName?.trim()) &&
        Boolean(profile.industry?.trim()) &&
        Boolean(profile.size?.trim()) &&
        Boolean(profile.description?.trim());
      const hasIntent =
        profile.isHiring &&
        profile.hiringIntents.length > 0 &&
        profile.aiRequirements.length > 0;
      if (!hasBasic || !hasIntent) {
        return reply.code(400).send({
          success: false,
          error: "Complete all required onboarding sections before submission",
          data: {
            missing: [
              ...(hasBasic ? [] : ["basic"]),
              ...(hasIntent ? [] : ["intent"]),
            ],
          },
        });
      }
      if (body.gstNumber) {
        await profileService.updateProfile(request.user.userId, {
          companyName: profile.companyName,
          description: profile.description,
          website: profile.website,
          logoUrl: profile.logoUrl,
          location: profile.location,
          size: profile.size,
          industry: profile.industry,
          foundedYear: profile.foundedYear,
          gstNumber: body.gstNumber,
        });
      }
      return successResponse({
        completed: true,
        profileStatus: "active",
        verification: {
          gstProvided: Boolean(body.gstNumber),
          linkedinProvided: Boolean(body.linkedinCompanyPage),
          websiteVerified: profile.websiteVerified,
        },
      });
    },
  );

  // Update hiring status
  fastify.post(
    "/profile/hiring",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const body = companyHiringSchema.parse(request.body);
      const profile = await profileService.updateHiringStatus(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Calculate trust score
  fastify.post(
    "/profile/calculate-trust-score",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getOrCreateProfile(
        request.user.userId,
      );
      const trustScore = await profileService.calculateTrustScore(profile.id);
      return successResponse({ trustScore });
    },
  );

  // Upload logo
  fastify.post(
    "/profile/upload-logo",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const data = await request.file();

      if (!data) {
        throw new Error("No file uploaded");
      }

      const buffer = await data.toBuffer();
      const url = await s3Service.uploadFile(
        buffer,
        data.filename,
        data.mimetype,
        "company-logos",
      );

      return successResponse({ url });
    },
  );

  // Generate presigned URL for logo upload
  fastify.post(
    "/profile/presigned-url",
    {
      preHandler: [authenticate, requireCompany],
    },
    async (request: any, _reply) => {
      const { filename, contentType } = request.body as any;
      const result = await s3Service.generatePresignedUrl(
        filename,
        contentType,
        "company-logos",
      );
      return successResponse(result);
    },
  );
}
