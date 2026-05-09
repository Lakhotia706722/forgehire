import { getPrismaClient } from '../config/database';

export interface CompletenessResult {
  score: number;
  missingFields: string[];
  suggestions: string[];
  canAccessAssessment: boolean;
}

export class ProfileCompletenessService {
  private prisma = getPrismaClient();

  /**
   * Calculate profile completeness score (0-100)
   * Minimum 70% required to unlock assessment
   */
  async calculateCompleteness(engineerProfileId: string): Promise<CompletenessResult> {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
      include: {
        skills: true,
        projects: true,
        experiences: true
      }
    });

    if (!profile) {
      throw new Error('Engineer profile not found');
    }

    const weights = {
      basicInfo: 15,
      skills: 20,
      experience: 15,
      projects: 25,
      pricing: 10,
      payment: 5,
      kyc: 10
    };

    let score = 0;
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Basic Info (15%)
    if (profile.basicInfoComplete) {
      score += weights.basicInfo;
    } else {
      missingFields.push('Basic Information');
      suggestions.push('Complete your basic profile information including name, bio, and location');
    }

    // Skills (20%)
    if (profile.skillsComplete && profile.skills.length >= 3) {
      score += weights.skills;
    } else if (profile.skills.length === 0) {
      missingFields.push('Skills');
      suggestions.push('Add at least 3 skills with proficiency levels');
    } else if (profile.skills.length < 3) {
      score += (profile.skills.length / 3) * weights.skills;
      missingFields.push('More Skills');
      suggestions.push(`Add ${3 - profile.skills.length} more skill(s) to reach the minimum`);
    }

    // Experience (15%)
    if (profile.experienceComplete && profile.experiences.length >= 1) {
      score += weights.experience;
    } else {
      missingFields.push('Work Experience');
      suggestions.push('Add at least one work experience entry');
    }

    // Projects (25%)
    if (profile.projectsComplete && profile.projects.length >= 2) {
      score += weights.projects;
    } else if (profile.projects.length === 0) {
      missingFields.push('Projects');
      suggestions.push('Showcase at least 2 projects with detailed descriptions');
    } else if (profile.projects.length === 1) {
      score += (1 / 2) * weights.projects;
      missingFields.push('More Projects');
      suggestions.push('Add one more project to reach the minimum');
    }

    // Pricing (10%)
    if (profile.pricingComplete) {
      score += weights.pricing;
    } else {
      missingFields.push('Pricing');
      suggestions.push('Set your hourly rate or rate range');
    }

    // Payment (5%)
    if (profile.paymentComplete && profile.upiId) {
      score += weights.payment;
    } else {
      missingFields.push('Payment Details');
      suggestions.push('Add your UPI ID for receiving payments');
    }

    // KYC (10%)
    if (profile.kycComplete || profile.kycVerified) {
      score += weights.kyc;
    } else {
      missingFields.push('KYC Verification');
      suggestions.push('Complete KYC verification to build trust with companies');
    }

    const finalScore = Math.round(score);
    const canAccessAssessment = finalScore >= 70;

    // Update the profile with the new score
    await this.prisma.engineerProfile.update({
      where: { id: engineerProfileId },
      data: { completenessScore: finalScore }
    });

    return {
      score: finalScore,
      missingFields,
      suggestions,
      canAccessAssessment
    };
  }

  /**
   * Update step completion status
   */
  async updateStepCompletion(
    engineerProfileId: string,
    step: string,
    completed: boolean
  ): Promise<void> {
    const updateData: any = {};
    
    switch (step) {
      case 'basicInfo':
        updateData.basicInfoComplete = completed;
        break;
      case 'skills':
        updateData.skillsComplete = completed;
        break;
      case 'experience':
        updateData.experienceComplete = completed;
        break;
      case 'projects':
        updateData.projectsComplete = completed;
        break;
      case 'pricing':
        updateData.pricingComplete = completed;
        break;
      case 'payment':
        updateData.paymentComplete = completed;
        break;
      case 'kyc':
        updateData.kycComplete = completed;
        break;
      default:
        throw new Error(`Invalid step: ${step}`);
    }

    await this.prisma.engineerProfile.update({
      where: { id: engineerProfileId },
      data: updateData
    });

    // Recalculate completeness after update
    await this.calculateCompleteness(engineerProfileId);
  }

  /**
   * Get profile builder progress
   */
  async getBuilderProgress(engineerProfileId: string) {
    const profile = await this.prisma.engineerProfile.findUnique({
      where: { id: engineerProfileId },
      select: {
        basicInfoComplete: true,
        skillsComplete: true,
        experienceComplete: true,
        projectsComplete: true,
        pricingComplete: true,
        paymentComplete: true,
        kycComplete: true,
        completenessScore: true
      }
    });

    if (!profile) {
      throw new Error('Engineer profile not found');
    }

    const steps = [
      { name: 'Basic Info', key: 'basicInfoComplete', completed: profile.basicInfoComplete },
      { name: 'Skills', key: 'skillsComplete', completed: profile.skillsComplete },
      { name: 'Experience', key: 'experienceComplete', completed: profile.experienceComplete },
      { name: 'Projects', key: 'projectsComplete', completed: profile.projectsComplete },
      { name: 'Pricing', key: 'pricingComplete', completed: profile.pricingComplete },
      { name: 'Payment', key: 'paymentComplete', completed: profile.paymentComplete },
      { name: 'KYC', key: 'kycComplete', completed: profile.kycComplete }
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;

    return {
      steps,
      completedSteps,
      totalSteps,
      completenessScore: profile.completenessScore,
      canAccessAssessment: profile.completenessScore >= 70
    };
  }
}
