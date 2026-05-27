import { FastifyInstance } from "fastify";
import { EngineerProfileService } from "../services/engineer-profile.service";
import { ProfileCompletenessService } from "../services/profile-completeness.service";
import { AISuggestionsService } from "../services/ai-suggestions.service";
import { S3UploadService } from "../services/s3-upload.service";
import { successResponse } from "@neuronhire/shared";
import { authenticate, requireEngineer } from "../middleware/auth";
import {
  engineerBasicInfoSchema,
  engineerSkillSchema,
  engineerProjectSchema,
  engineerExperienceSchema,
  engineerPricingSchema,
  engineerPaymentSchema,
  engineerAvailabilitySchema,
  engineerProfilePatchSchema,
} from "@neuronhire/shared";

export async function engineerProfileRoutes(
  fastify: FastifyInstance,
): Promise<void> {
  const profileService = new EngineerProfileService();
  const completenessService = new ProfileCompletenessService();
  const aiService = new AISuggestionsService();
  const s3Service = new S3UploadService();

  // Public profile by ID (no auth)
  fastify.get(
    "/profiles/:id",
    async (request: any, reply) => {
      const { id } = request.params as { id: string };
      const profile = await profileService.getPublicProfileById(id);
      if (!profile) {
        return reply
          .code(404)
          .send({ success: false, error: "Profile not found" });
      }
      return successResponse(profile);
    },
  );

  // Get profile
  fastify.get(
    "/profile",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getFullProfile(
        request.user.userId,
        { ensureExists: true },
      );
      return successResponse(profile);
    },
  );

  // Update profile (edit page — single PATCH)
  fastify.patch(
    "/profile",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerProfilePatchSchema.parse(request.body);
      const profile = await profileService.updateProfile(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Update basic info (Step 1)
  fastify.post(
    "/profile/basic-info",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerBasicInfoSchema.parse(request.body);
      const profile = await profileService.updateBasicInfo(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Add skill (Step 2)
  fastify.post(
    "/profile/skills",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerSkillSchema.parse(request.body);
      const skill = await profileService.addSkill(request.user.userId, body);
      return successResponse(skill);
    },
  );

  // Update skill
  fastify.put(
    "/profile/skills/:skillId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { skillId } = request.params;
      const body = engineerSkillSchema.partial().parse(request.body);
      const skill = await profileService.updateSkill(skillId, body);
      return successResponse(skill);
    },
  );

  // Delete skill
  fastify.delete(
    "/profile/skills/:skillId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { skillId } = request.params;
      await profileService.deleteSkill(skillId);
      return successResponse({ message: "Skill deleted successfully" });
    },
  );

  // Add experience (Step 3)
  fastify.post(
    "/profile/experiences",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerExperienceSchema.parse(request.body);
      const experience = await profileService.addExperience(
        request.user.userId,
        body,
      );
      return successResponse(experience);
    },
  );

  // Update experience
  fastify.put(
    "/profile/experiences/:experienceId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { experienceId } = request.params;
      const body = engineerExperienceSchema.partial().parse(request.body);
      const experience = await profileService.updateExperience(
        experienceId,
        body,
      );
      return successResponse(experience);
    },
  );

  // Delete experience
  fastify.delete(
    "/profile/experiences/:experienceId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { experienceId } = request.params;
      await profileService.deleteExperience(experienceId);
      return successResponse({ message: "Experience deleted successfully" });
    },
  );

  // Add project (Step 4)
  fastify.post(
    "/profile/projects",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerProjectSchema.parse(request.body);
      const project = await profileService.addProject(
        request.user.userId,
        body,
      );
      return successResponse(project);
    },
  );

  // Update project
  fastify.put(
    "/profile/projects/:projectId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { projectId } = request.params;
      const body = engineerProjectSchema.partial().parse(request.body);
      const project = await profileService.updateProject(projectId, body);
      return successResponse(project);
    },
  );

  // Delete project
  fastify.delete(
    "/profile/projects/:projectId",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { projectId } = request.params;
      await profileService.deleteProject(projectId);
      return successResponse({ message: "Project deleted successfully" });
    },
  );

  // Update pricing (Step 5)
  fastify.post(
    "/profile/pricing",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerPricingSchema.parse(request.body);
      const profile = await profileService.updatePricing(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Update payment (Step 6)
  fastify.post(
    "/profile/payment",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerPaymentSchema.parse(request.body);
      const profile = await profileService.updatePayment(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Update availability
  fastify.post(
    "/profile/availability",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = engineerAvailabilitySchema.parse(request.body);
      const profile = await profileService.updateAvailability(
        request.user.userId,
        body,
      );
      return successResponse(profile);
    },
  );

  // Get profile completeness
  fastify.get(
    "/profile/completeness",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getOrCreateProfile(
        request.user.userId,
      );
      const completeness = await completenessService.calculateCompleteness(
        profile.id,
      );
      return successResponse(completeness);
    },
  );

  // Get builder progress
  fastify.get(
    "/profile/builder-progress",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getOrCreateProfile(
        request.user.userId,
      );
      const progress = await completenessService.getBuilderProgress(profile.id);
      return successResponse(progress);
    },
  );

  // Get AI suggestions
  fastify.get(
    "/profile/ai-suggestions",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const profile = await profileService.getFullProfile(request.user.userId);

      if (!profile) {
        return successResponse({ suggestions: [] });
      }

      const suggestions = await aiService.generateProfileSuggestions(
        profile.completeness.missingFields,
        {
          fullName: profile.fullName,
          bio: profile.bio,
          skillCount: profile.skills.length,
          projectCount: profile.projects.length,
          experienceCount: profile.experiences.length,
        },
      );

      return successResponse({ suggestions });
    },
  );

  // Upload screenshot
  fastify.post(
    "/profile/upload-screenshot",
    {
      preHandler: [authenticate, requireEngineer],
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
        "project-screenshots",
      );

      return successResponse({ url });
    },
  );

  // Generate presigned URL for upload
  fastify.post(
    "/profile/presigned-url",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { filename, contentType } = request.body as any;
      const result = await s3Service.generatePresignedUrl(
        filename,
        contentType,
        "project-screenshots",
      );
      return successResponse(result);
    },
  );
}
