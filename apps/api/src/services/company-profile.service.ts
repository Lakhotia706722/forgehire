import { getPrismaClient } from '../config/database';
import { getTypesenseClient } from '../config/typesense';
import { v4 as uuidv4 } from 'uuid';
import { CompanyProfileInput, CompanyHiringInput } from '@neuronhire/shared';
import axios from 'axios';

export class CompanyProfileService {
  private prisma = getPrismaClient();
  private typesense = getTypesenseClient();

  /**
   * Create or get company profile
   */
  async getOrCreateProfile(userId: string) {
    let profile = await this.prisma.companyProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await this.prisma.companyProfile.create({
        data: {
          id: uuidv4(),
          userId,
          companyName: '',
          trustScore: 0
        }
      });
    }

    return profile;
  }

  /**
   * Update company profile
   */
  async updateProfile(userId: string, data: CompanyProfileInput) {
    const profile = await this.getOrCreateProfile(userId);

    // Verify website if provided
    let websiteVerified = false;
    if (data.website) {
      websiteVerified = await this.verifyWebsite(data.website, profile.id);
    }

    // Verify GST if provided
    let gstVerified = false;
    if (data.gstNumber) {
      gstVerified = this.verifyGSTFormat(data.gstNumber);
    }

    const updated = await this.prisma.companyProfile.update({
      where: { id: profile.id },
      data: {
        ...data,
        websiteVerified,
        gstVerified
      }
    });

    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Update hiring status and intents
   */
  async updateHiringStatus(userId: string, data: CompanyHiringInput) {
    const profile = await this.getOrCreateProfile(userId);

    const updated = await this.prisma.companyProfile.update({
      where: { id: profile.id },
      data
    });

    await this.indexProfile(updated.id);

    return updated;
  }

  /**
   * Calculate and update trust score
   * Composite of: payment history, engineer reviews, response rate, account age
   */
  async calculateTrustScore(profileId: string): Promise<number> {
    const profile = await this.prisma.companyProfile.findUnique({
      where: { id: profileId }
    });

    if (!profile) {
      throw new Error('Company profile not found');
    }

    let score = 0;

    // Base score for verified information (40 points)
    if (profile.websiteVerified) score += 20;
    if (profile.gstVerified) score += 20;

    // Account age (20 points max)
    const accountAgeMonths = Math.floor(
      (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    score += Math.min(accountAgeMonths * 2, 20);

    // Profile completeness (20 points)
    let completenessPoints = 0;
    if (profile.companyName) completenessPoints += 5;
    if (profile.description) completenessPoints += 5;
    if (profile.website) completenessPoints += 5;
    if (profile.industry) completenessPoints += 5;
    score += completenessPoints;

    // Hiring activity (20 points)
    if (profile.isHiring) score += 10;
    if (profile.hiringIntents.length > 0) score += 5;
    if (profile.aiRequirements.length > 0) score += 5;

    // Cap at 100
    score = Math.min(score, 100);

    // Update the profile
    await this.prisma.companyProfile.update({
      where: { id: profileId },
      data: { trustScore: score }
    });

    await this.indexProfile(profileId);

    return score;
  }

  /**
   * Verify website ownership via DNS meta-tag check
   */
  private async verifyWebsite(website: string, profileId: string): Promise<boolean> {
    try {
      // Fetch the website HTML
      const response = await axios.get(website, {
        timeout: 5000,
        headers: {
          'User-Agent': 'NeuronHire-Verification-Bot/1.0'
        }
      });

      const html = response.data;

      // Look for verification meta tag
      // Expected format: <meta name="neuronhire-verification" content="profile-id">
      const metaTagRegex = new RegExp(
        `<meta\\s+name=["']neuronhire-verification["']\\s+content=["']${profileId}["']`,
        'i'
      );

      return metaTagRegex.test(html);
    } catch (error) {
      console.error('Website verification error:', error);
      return false;
    }
  }

  /**
   * Verify GST number format
   */
  private verifyGSTFormat(gstNumber: string): boolean {
    // GST format: 2 digits (state code) + 10 chars (PAN) + 1 char (entity number) + Z + 1 alphanumeric
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
  }

  /**
   * Index profile in Typesense for search
   */
  private async indexProfile(profileId: string) {
    try {
      const profile = await this.prisma.companyProfile.findUnique({
        where: { id: profileId }
      });

      if (!profile) return;

      const document = {
        id: profile.id,
        userId: profile.userId,
        companyName: profile.companyName,
        description: profile.description || '',
        industry: profile.industry || '',
        location: profile.location || '',
        trustScore: profile.trustScore,
        isHiring: profile.isHiring,
        hiringIntents: profile.hiringIntents,
        aiRequirements: profile.aiRequirements,
        createdAt: Math.floor(profile.createdAt.getTime() / 1000)
      };

      await this.typesense.collections('company_profiles').documents().upsert(document);
    } catch (error) {
      console.error('Typesense indexing error:', error);
    }
  }

  /**
   * Get full profile
   */
  async getFullProfile(userId: string) {
    return await this.prisma.companyProfile.findUnique({
      where: { userId }
    });
  }
}
