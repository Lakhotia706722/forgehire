import { FastifyInstance } from "fastify";
import { CompanyProfileService } from "../services/company-profile.service";
import { S3UploadService } from "../services/s3-upload.service";
import { successResponse } from "@neuronhire/shared";
import { authenticate, requireCompany } from "../middleware/auth";
import { companyProfileSchema, companyHiringSchema } from "@neuronhire/shared";

export async function companyProfileRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const profileService = new CompanyProfileService();
  const s3Service = new S3UploadService();

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
