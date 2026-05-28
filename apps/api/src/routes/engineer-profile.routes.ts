import { FastifyInstance } from "fastify";
import { EngineerProfileService } from "../services/engineer-profile.service";
import { ProfileCompletenessService } from "../services/profile-completeness.service";
import { AISuggestionsService } from "../services/ai-suggestions.service";
import { S3UploadService } from "../services/s3-upload.service";
import { getPrismaClient } from "../config/database";
import { successResponse } from "@neuronhire/shared";
import { authenticate, requireEngineer } from "../middleware/auth";
import { z } from "zod";
import sharp from "sharp";
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
  const prisma = getPrismaClient();

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
  const onboardingBasicSchema = z.object({
    fullName: z.string().min(2),
    photo: z.string().url().optional().nullable(),
    headline: z.string().max(100),
    location: z.string().min(1),
    timezone: z.string().min(1),
    workMode: z.enum(["remote", "hybrid", "onsite"]),
  });
  const onboardingSkillsSchema = z.object({
    primarySkills: z.array(z.string().min(1)).max(5),
    secondarySkills: z.array(z.string().min(1)),
  });
  const onboardingExperienceSchema = z.object({
    companyName: z.string().min(1),
    roleTitle: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1).optional().nullable(),
    description: z.string().min(1),
    impactMetrics: z.string().optional().nullable(),
    techUsed: z.array(z.string()).optional().default([]),
    verified: z.boolean().optional().default(false),
  });
  const onboardingProjectSchema = z.object({
    title: z.string().min(3),
    type: z.enum(["Agent", "SaaS", "API", "Tool", "Model", "Dataset"]),
    problemSolved: z.string().min(1),
    description: z.string().min(10),
    techStack: z.array(z.string()).min(1),
    modelUsed: z.string().optional().nullable(),
    architectureType: z
      .enum(["RAG", "Fine-tuned", "Agent-based", "Hybrid"])
      .optional()
      .nullable(),
    industryUseCase: z.string().optional().nullable(),
    demoUrl: z.string().url().optional().nullable(),
    githubUrl: z.string().url().optional().nullable(),
    screenshots: z.array(z.string().url()).max(5).optional().default([]),
    performanceMetrics: z.string().optional().nullable(),
    monetizationStatus: z
      .enum(["Free", "Paid", "Subscription"])
      .optional()
      .nullable(),
  });
  const onboardingPricingSchema = z.object({
    hourlyRate: z.number().nonnegative().optional().nullable(),
    projectRate: z.number().nonnegative().optional().nullable(),
    availabilityStatus: z.enum([
      "available_now",
      "available_in_x_weeks",
      "not_available",
    ]),
    availableFrom: z.string().optional().nullable(),
  });
  const onboardingPaymentSchema = z.object({
    upiId: z.string().regex(/^[\w.-]+@[\w.-]+$/),
    bankAccount: z
      .object({
        accountNumber: z.string().min(6).optional().nullable(),
        ifsc: z.string().min(4).optional().nullable(),
        accountHolderName: z.string().min(2).optional().nullable(),
      })
      .optional()
      .nullable(),
    panNumber: z.string().optional().nullable(),
  });

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

  // Update basic info (onboarding spec alias)
  fastify.put(
    "/profile/basic",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingBasicSchema.parse(request.body);
      const profile = await profileService.updateBasicInfo(request.user.userId, {
        fullName: body.fullName,
        headline: body.headline,
        location: body.location,
      });
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

  // Replace skills (onboarding spec alias)
  fastify.put(
    "/profile/skills",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingSkillsSchema.parse(request.body);
      const profile = await profileService.getOrCreateProfile(request.user.userId);
      const all = [...body.primarySkills, ...body.secondarySkills];
      const deduped = Array.from(new Set(all.map((s) => s.trim()).filter(Boolean)));

      await prisma.engineerSkill.deleteMany({
        where: { engineerProfileId: profile.id },
      });

      for (const skillName of deduped) {
        await profileService.addSkill(request.user.userId, {
          skillName,
          proficiencyLevel: "intermediate",
          projectCount: 0,
          verified: false,
        });
      }

      return successResponse({
        primarySkills: body.primarySkills,
        secondarySkills: body.secondarySkills,
      });
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

  // Add experience (onboarding spec alias)
  fastify.post(
    "/profile/experience/:id",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingExperienceSchema.parse(request.body);
      const result = await profileService.addExperience(request.user.userId, {
        title: body.roleTitle,
        company: body.companyName,
        startDate: new Date(body.startDate).toISOString(),
        endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
        current: !body.endDate,
        description: body.description,
        achievements: [body.impactMetrics, ...(body.techUsed ?? [])].filter(
          Boolean,
        ) as string[],
      });
      return successResponse(result);
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

  // Update experience (onboarding spec alias)
  fastify.put(
    "/profile/experience/:id",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { id } = request.params as { id: string };
      const body = onboardingExperienceSchema.parse(request.body);
      const result = await profileService.updateExperience(id, {
        title: body.roleTitle,
        company: body.companyName,
        startDate: new Date(body.startDate).toISOString(),
        endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
        current: !body.endDate,
        description: body.description,
        achievements: [body.impactMetrics, ...(body.techUsed ?? [])].filter(
          Boolean,
        ) as string[],
      });
      return successResponse(result);
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

  // Delete experience (onboarding spec alias)
  fastify.delete(
    "/profile/experience/:id",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const { id } = request.params as { id: string };
      await profileService.deleteExperience(id);
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

  // Add project (onboarding spec alias)
  fastify.post(
    "/profile/projects/:id",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingProjectSchema.parse(request.body);
      const project = await profileService.addProject(request.user.userId, {
        title: body.title,
        description: body.description,
        problemSolved: body.problemSolved,
        techStack: body.techStack,
        demoUrl: body.demoUrl ?? null,
        githubUrl: body.githubUrl ?? null,
        screenshots: body.screenshots,
        performanceMetrics: body.performanceMetrics
          ? { notes: body.performanceMetrics }
          : null,
        aiModelUsed: body.modelUsed ?? null,
        architectureType: body.architectureType ?? null,
        featured: false,
      });
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

  // Update pricing (onboarding spec alias)
  fastify.put(
    "/profile/pricing",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingPricingSchema.parse(request.body);
      const profile = await profileService.updatePricing(request.user.userId, {
        hourlyRate: body.hourlyRate ?? null,
        minHourlyRate: body.projectRate ?? null,
        maxHourlyRate: null,
      });
      await profileService.updateAvailability(request.user.userId, {
        availabilityStatus:
          body.availabilityStatus === "available_in_x_weeks"
            ? "available_in_weeks"
            : body.availabilityStatus,
        availableInWeeks:
          body.availabilityStatus === "available_in_x_weeks" && body.availableFrom
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(body.availableFrom).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24 * 7),
                ),
              )
            : null,
      });
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

  // Update payment (onboarding spec alias)
  fastify.put(
    "/profile/payment",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, _reply) => {
      const body = onboardingPaymentSchema.parse(request.body);
      const profile = await profileService.updatePayment(request.user.userId, {
        upiId: body.upiId,
      });
      return successResponse({
        ...profile,
        bankAccountMasked: body.bankAccount?.accountNumber
          ? `****${body.bankAccount.accountNumber.slice(-4)}`
          : null,
        panNumberSet: Boolean(body.panNumber),
      });
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

  // Complete onboarding (Step 8)
  fastify.post(
    "/profile/complete",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, reply) => {
      const profile = await profileService.getOrCreateProfile(request.user.userId);
      const complete = await completenessService.calculateCompleteness(profile.id);

      const weightedBreakdown = {
        basicInfo: profile.basicInfoComplete ? 15 : 0,
        skills: profile.skillsComplete && profile.skills.length >= 1 ? 15 : 0,
        experience:
          profile.experienceComplete && profile.experiences.length >= 1 ? 15 : 0,
        projects:
          profile.projectsComplete && profile.projects.length >= 1 ? 30 : 0,
        pricing: profile.pricingComplete ? 15 : 0,
        payment: profile.paymentComplete && Boolean(profile.upiId) ? 10 : 0,
      };
      const profileCompleteness = Object.values(weightedBreakdown).reduce(
        (sum, v) => sum + v,
        0,
      );

      if (profile.projects.length < 1) {
        return reply.status(400).send({
          success: false,
          error: "At least one project is required before submission",
          data: { profileCompleteness, weightedBreakdown },
        });
      }

      const nextStatus =
        profileCompleteness >= 70 ? "assessment_ready" : "incomplete";
      await prisma.engineerProfile.update({
        where: { id: profile.id },
        data: {
          completenessScore: profileCompleteness,
          neuronScore: 0,
          neuronTier: profileCompleteness >= 70 ? "pending" : "conditional",
        },
      });

      const missingSections = Object.entries(weightedBreakdown)
        .filter(([, value]) => value === 0)
        .map(([key]) => key);

      return successResponse({
        profileCompleteness,
        weightedBreakdown,
        canStartAssessment: profileCompleteness >= 70,
        profileStatus: nextStatus,
        missingSections,
        completeness: complete,
      });
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

  // Upload profile photo (onboarding step 1)
  fastify.post(
    "/profile/photo",
    {
      preHandler: [authenticate, requireEngineer],
    },
    async (request: any, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({
          success: false,
          error: "No image uploaded",
        });
      }

      const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!allowedTypes.has(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: "Only JPG, PNG, or WebP images are allowed",
        });
      }

      const rawBuffer = await data.toBuffer();
      const maxSizeBytes = 5 * 1024 * 1024;
      if (rawBuffer.length > maxSizeBytes) {
        return reply.code(400).send({
          success: false,
          error: "Image must be 5MB or smaller",
        });
      }

      const resizedBuffer = await sharp(rawBuffer)
        .resize(400, 400, { fit: "cover", position: "centre" })
        .webp({ quality: 85 })
        .toBuffer();

      const safeFilename = (data.filename || "profile").replace(
        /[^a-zA-Z0-9._-]/g,
        "_",
      );
      const url = await s3Service.uploadFile(
        resizedBuffer,
        safeFilename.endsWith(".webp") ? safeFilename : `${safeFilename}.webp`,
        "image/webp",
        "profile-photos",
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
