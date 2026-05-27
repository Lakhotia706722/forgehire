import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

export class ReferralService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate referral link
   */
  async generateReferralLink(userId: string, productId?: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If product-specific, validate product exists
    if (productId) {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error("Product not found");
      }
    }

    // Generate unique referral code
    const referralCode = this.generateReferralCode();

    // Check uniqueness
    const existing = await this.prisma.referralLink.findUnique({
      where: { referralCode },
    });

    if (existing) {
      // Retry with new code
      return await this.generateReferralLink(userId, productId);
    }

    // Create referral link
    const referralLink = await this.prisma.referralLink.create({
      data: {
        userId,
        productId,
        referralCode,
        active: true,
      },
    });

    return referralLink;
  }

  /**
   * Track referral click
   */
  async trackClick(referralCode: string) {
    const referralLink = await this.prisma.referralLink.findUnique({
      where: { referralCode },
    });

    if (!referralLink) {
      throw new Error("Referral link not found");
    }

    if (!referralLink.active) {
      throw new Error("Referral link is inactive");
    }

    // Increment click count
    await this.prisma.referralLink.update({
      where: { referralCode },
      data: {
        clickCount: { increment: 1 },
      },
    });

    return referralLink;
  }

  /**
   * Get referral link by code
   */
  async getReferralLink(referralCode: string) {
    const referralLink = await this.prisma.referralLink.findUnique({
      where: { referralCode },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnailUrl: true,
            category: true,
            priceINR: true,
          },
        },
      },
    });

    if (!referralLink) {
      throw new Error("Referral link not found");
    }

    return referralLink;
  }

  /**
   * Get user's referral links
   */
  async getUserReferralLinks(userId: string) {
    return await this.prisma.referralLink.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            thumbnailUrl: true,
          },
        },
      },
    });
  }

  /**
   * Get referral stats
   */
  async getReferralStats(userId: string) {
    const referralLinks = await this.prisma.referralLink.findMany({
      where: { userId },
    });

    const totalClicks = referralLinks.reduce(
      (sum, link) => sum + link.clickCount,
      0,
    );
    const totalPurchases = referralLinks.reduce(
      (sum, link) => sum + link.purchaseCount,
      0,
    );
    const totalCommission = referralLinks.reduce(
      (sum, link) => sum + Number(link.totalCommission),
      0,
    );

    const conversionRate =
      totalClicks > 0 ? (totalPurchases / totalClicks) * 100 : 0;

    return {
      totalLinks: referralLinks.length,
      activeLinks: referralLinks.filter((l) => l.active).length,
      totalClicks,
      totalPurchases,
      totalCommission,
      conversionRate,
      topPerformingLinks: referralLinks
        .sort((a, b) => Number(b.totalCommission) - Number(a.totalCommission))
        .slice(0, 5),
    };
  }

  /**
   * Toggle referral link status
   */
  async toggleReferralLink(referralLinkId: string, userId: string) {
    const referralLink = await this.prisma.referralLink.findUnique({
      where: { id: referralLinkId },
    });

    if (!referralLink) {
      throw new Error("Referral link not found");
    }

    if (referralLink.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return await this.prisma.referralLink.update({
      where: { id: referralLinkId },
      data: {
        active: !referralLink.active,
      },
    });
  }

  /**
   * Delete referral link
   */
  async deleteReferralLink(referralLinkId: string, userId: string) {
    const referralLink = await this.prisma.referralLink.findUnique({
      where: { id: referralLinkId },
    });

    if (!referralLink) {
      throw new Error("Referral link not found");
    }

    if (referralLink.userId !== userId) {
      throw new Error("Unauthorized");
    }

    await this.prisma.referralLink.delete({
      where: { id: referralLinkId },
    });

    return { success: true };
  }

  // Helper methods

  private generateReferralCode(): string {
    const random = randomBytes(4).toString("hex").toUpperCase();
    return `REF${random}`;
  }
}
