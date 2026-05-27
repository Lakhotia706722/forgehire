import { getPrismaClient } from "../config/database";
import { getTypesenseClient } from "../config/typesense";
import { isTypesenseEnabled } from "../config/env";
import { ProfileCompletenessService } from "./profile-completeness.service";
import { v4 as uuidv4 } from "uuid";
import { Prisma } from "@prisma/client";
import {
  EngineerBasicInfoInput,
  EngineerSkillInput,
  EngineerProjectInput,
  EngineerExperienceInput,
  EngineerPricingInput,
  EngineerPaymentInput,
  EngineerAvailabilityInput,
  EngineerProfilePatchInput,
} from "@neuronhire/shared";

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value == null) return null;
  return typeof value === "number" ? value : Number(value);
}

/** JSON-safe engineer profile (Prisma Decimal → number). */
function serializeEngineerProfile<T extends Record<string, unknown>>(profile: T) {
  return {
    ...profile,
    hourlyRate: toNumber(profile.hourlyRate as Prisma.Decimal | null),
    minHourlyRate: toNumber(profile.minHourlyRate as Prisma.Decimal | null),
    maxHourlyRate: toNumber(profile.maxHourlyRate as Prisma.Decimal | null),
  };
}

export class EngineerProfileService {
  private prisma = getPrismaClient();
  private completenessService = new ProfileCompletenessService();

  /**
   * Create or get engineer profile
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.engineerProfile.findUnique({
      where: { userId },
      include: {
        skills: true,
        projects: true,
        experiences: true,
      },
    });

    if (!profile) {
      profile = await this.prisma.engineerProfile.create({
        data: {
          id: uuidv4(),
          userId,
          fullName: "",
          completenessScore: 0,
        },
        include: {
          skills: true,
          projects: true,
          experiences: true,
        },
      });
    }

    return profile;
  }

  /**
   * Update basic info (Step 1)
   */
  async updateBasicInfo(userId: string, data: EngineerBasicInfoInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.engineerProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        basicInfoComplete: true,
      },
    });

    await this.completenessService.updateStepCompletion(
      profile.id,
      "basicInfo",
      true,
    );
    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Add skill (Step 2)
   */
  async addSkill(userId: string, data: EngineerSkillInput) {
    const profile = await this.getOrCreateProfile(userId);

    const skill = await this.prisma.engineerSkill.create({
      data: {
        id: uuidv4(),
        engineerProfileId: profile.id,
        ...data,
      },
    });

    // Check if we have at least 3 skills
    const skillCount = await this.prisma.engineerSkill.count({
      where: { engineerProfileId: profile.id },
    });

    if (skillCount >= 3) {
      await this.completenessService.updateStepCompletion(
        profile.id,
        "skills",
        true,
      );
    }

    await this.indexProfile(profile.id);

    return skill;
  }

  /**
   * Update skill
   */
  async updateSkill(skillId: string, data: Partial<EngineerSkillInput>) {
    const skill = await this.prisma.engineerSkill.update({
      where: { id: skillId },
      data,
    });

    await this.indexProfile(skill.engineerProfileId);

    return skill;
  }

  /**
   * Delete skill
   */
  async deleteSkill(skillId: string) {
    const skill = await this.prisma.engineerSkill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new Error("Skill not found");
    }

    await this.prisma.engineerSkill.delete({
      where: { id: skillId },
    });

    // Check if we still have at least 3 skills
    const skillCount = await this.prisma.engineerSkill.count({
      where: { engineerProfileId: skill.engineerProfileId },
    });

    if (skillCount < 3) {
      await this.completenessService.updateStepCompletion(
        skill.engineerProfileId,
        "skills",
        false,
      );
    }

    await this.indexProfile(skill.engineerProfileId);
  }

  /**
   * Add experience (Step 3)
   */
  async addExperience(userId: string, data: EngineerExperienceInput) {
    const profile = await this.getOrCreateProfile(userId);

    const experience = await this.prisma.engineerExperience.create({
      data: {
        id: uuidv4(),
        engineerProfileId: profile.id,
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    await this.completenessService.updateStepCompletion(
      profile.id,
      "experience",
      true,
    );

    return experience;
  }

  /**
   * Update experience
   */
  async updateExperience(
    experienceId: string,
    data: Partial<EngineerExperienceInput>,
  ) {
    return await this.prisma.engineerExperience.update({
      where: { id: experienceId },
      data: {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  /**
   * Delete experience
   */
  async deleteExperience(experienceId: string) {
    const experience = await this.prisma.engineerExperience.findUnique({
      where: { id: experienceId },
    });

    if (!experience) {
      throw new Error("Experience not found");
    }

    await this.prisma.engineerExperience.delete({
      where: { id: experienceId },
    });

    // Check if we still have at least 1 experience
    const expCount = await this.prisma.engineerExperience.count({
      where: { engineerProfileId: experience.engineerProfileId },
    });

    if (expCount === 0) {
      await this.completenessService.updateStepCompletion(
        experience.engineerProfileId,
        "experience",
        false,
      );
    }
  }

  /**
   * Add project (Step 4)
   */
  async addProject(userId: string, data: EngineerProjectInput) {
    const profile = await this.getOrCreateProfile(userId);

    const project = await this.prisma.engineerProject.create({
      data: {
        id: uuidv4(),
        engineerProfileId: profile.id,
        title: data.title,
        description: data.description,
        problemSolved: data.problemSolved,
        techStack: data.techStack,
        demoUrl: data.demoUrl,
        githubUrl: data.githubUrl,
        screenshots: data.screenshots,
        performanceMetrics: data.performanceMetrics
          ? (data.performanceMetrics as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        aiModelUsed: data.aiModelUsed,
        architectureType: data.architectureType,
        featured: data.featured ?? false,
      },
    });

    // Check if we have at least 2 projects
    const projectCount = await this.prisma.engineerProject.count({
      where: { engineerProfileId: profile.id },
    });

    if (projectCount >= 2) {
      await this.completenessService.updateStepCompletion(
        profile.id,
        "projects",
        true,
      );
    }

    return project;
  }

  /**
   * Update project
   */
  async updateProject(projectId: string, data: Partial<EngineerProjectInput>) {
    return await this.prisma.engineerProject.update({
      where: { id: projectId },
      data: {
        ...data,
        performanceMetrics:
          data.performanceMetrics !== undefined
            ? data.performanceMetrics
              ? (data.performanceMetrics as Prisma.InputJsonValue)
              : Prisma.JsonNull
            : undefined,
      },
    });
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string) {
    const project = await this.prisma.engineerProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    await this.prisma.engineerProject.delete({
      where: { id: projectId },
    });

    // Check if we still have at least 2 projects
    const projectCount = await this.prisma.engineerProject.count({
      where: { engineerProfileId: project.engineerProfileId },
    });

    if (projectCount < 2) {
      await this.completenessService.updateStepCompletion(
        project.engineerProfileId,
        "projects",
        false,
      );
    }
  }

  /**
   * Update pricing (Step 5)
   */
  async updatePricing(userId: string, data: EngineerPricingInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.engineerProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        pricingComplete: true,
      },
    });

    await this.completenessService.updateStepCompletion(
      profile.id,
      "pricing",
      true,
    );
    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Update payment details (Step 6)
   */
  async updatePayment(userId: string, data: EngineerPaymentInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.engineerProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        paymentComplete: true,
      },
    });

    await this.completenessService.updateStepCompletion(
      profile.id,
      "payment",
      true,
    );

    return updated;
  }

  /**
   * Update profile from edit page (single PATCH)
   */
  async updateProfile(userId: string, data: EngineerProfilePatchInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updateData: Prisma.EngineerProfileUpdateInput = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.headline !== undefined) updateData.headline = data.headline;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
    if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl;
    if (data.portfolioUrl !== undefined) updateData.portfolioUrl = data.portfolioUrl;
    if (data.yearsOfExperience !== undefined) {
      updateData.yearsOfExperience = data.yearsOfExperience;
    }
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.minHourlyRate !== undefined) updateData.minHourlyRate = data.minHourlyRate;
    if (data.maxHourlyRate !== undefined) updateData.maxHourlyRate = data.maxHourlyRate;
    if (data.availabilityStatus !== undefined) {
      updateData.availabilityStatus = data.availabilityStatus;
    }
    if (data.availableInWeeks !== undefined) {
      updateData.availableInWeeks = data.availableInWeeks;
    }

    if (data.fullName || data.bio || data.location) {
      updateData.basicInfoComplete = true;
    }
    if (data.hourlyRate !== undefined) {
      updateData.pricingComplete = true;
    }

    await this.prisma.engineerProfile.update({
      where: { id: profile.id },
      data: updateData,
    });

    await this.completenessService.calculateCompleteness(profile.id);
    await this.indexProfile(profile.id);

    return this.getFullProfile(userId);
  }

  /**
   * Update availability status
   */
  async updateAvailability(userId: string, data: EngineerAvailabilityInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.engineerProfile.update({
      where: { id: profile.id },
      data,
    });

    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Calculate and update NeuronScore
   */
  async updateNeuronScore(profileId: string, score: number) {
    let tier = "conditional";

    if (score >= 90) {
      tier = "elite";
    } else if (score >= 75) {
      tier = "professional";
    } else if (score >= 60) {
      tier = "verified";
    }

    const updated = await this.prisma.engineerProfile.update({
      where: { id: profileId },
      data: {
        neuronScore: score,
        neuronTier: tier,
      },
    });

    await this.indexProfile(profileId);

    return updated;
  }

  /**
   * Index profile in Typesense for search
   */
  private async indexProfile(profileId: string) {
    if (!isTypesenseEnabled()) return;

    try {
      const typesense = getTypesenseClient();
      const profile = await this.prisma.engineerProfile.findUnique({
        where: { id: profileId },
        include: {
          skills: true,
        },
      });

      if (!profile) return;

      const document = {
        id: profile.id,
        userId: profile.userId,
        fullName: profile.fullName,
        bio: profile.bio || "",
        location: profile.location || "",
        skills: profile.skills.map((s) => s.skillName),
        neuronScore: profile.neuronScore,
        neuronTier: profile.neuronTier,
        availabilityStatus: profile.availabilityStatus,
        hourlyRate: profile.hourlyRate
          ? parseFloat(profile.hourlyRate.toString())
          : 0,
        yearsOfExperience: profile.yearsOfExperience || 0,
        completenessScore: profile.completenessScore,
        createdAt: profile.createdAt
          ? Math.floor(profile.createdAt.getTime() / 1000)
          : Math.floor(Date.now() / 1000),
      };

      await typesense
        .collections("engineer_profiles")
        .documents()
        .upsert(document);
    } catch (error) {
      console.error("Typesense indexing error:", error);
      // Don't throw - indexing failure shouldn't break the main operation
    }
  }

  /**
   * Get full profile with all relations
   */
  async getFullProfile(
    userId: string,
    options?: { ensureExists?: boolean },
  ) {
    const include = {
      skills: { orderBy: { createdAt: "desc" as const } },
      projects: { orderBy: { displayOrder: "asc" as const } },
      experiences: { orderBy: { startDate: "desc" as const } },
    };

    let profile = await this.prisma.engineerProfile.findUnique({
      where: { userId },
      include,
    });

    if (!profile && options?.ensureExists) {
      await this.getOrCreateProfile(userId);
      profile = await this.prisma.engineerProfile.findUnique({
        where: { userId },
        include,
      });
    }

    if (!profile) {
      return null;
    }

    const completeness = await this.completenessService.calculateCompleteness(
      profile.id,
    );

    return serializeEngineerProfile({
      ...profile,
      completenessScore: completeness.score,
      completeness,
    });
  }

  /**
   * Public profile by engineer profile ID (browse / share links)
   */
  async getPublicProfileById(profileId: string) {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: profileId },
      include: {
        skills: { orderBy: { createdAt: "desc" } },
        projects: { orderBy: { displayOrder: "asc" } },
        experiences: { orderBy: { startDate: "desc" } },
        products: {
          where: { status: "published" },
          select: {
            id: true,
            name: true,
            slug: true,
            tagline: true,
            category: true,
            priceINR: true,
            pricingModel: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    });

    if (!profile || profile.completenessScore < 70) {
      return null;
    }

    return serializeEngineerProfile(profile);
  }
}
