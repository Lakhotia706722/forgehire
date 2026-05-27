import { PrismaClient } from "@prisma/client";

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get engineer analytics
   */
  async getEngineerAnalytics(
    engineerProfileId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const analytics = await this.prisma.engineerAnalytics.findMany({
      where: {
        engineerProfileId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate aggregates
    const totalViews = analytics.reduce((sum, a) => sum + a.profileViews, 0);
    const totalProposals = analytics.reduce(
      (sum, a) => sum + a.proposalsSent,
      0,
    );
    const totalAccepted = analytics.reduce(
      (sum, a) => sum + a.proposalsAccepted,
      0,
    );
    const totalEarnings = analytics.reduce(
      (sum, a) => sum + parseFloat(a.earnings.toString()),
      0,
    );

    const acceptanceRate =
      totalProposals > 0 ? (totalAccepted / totalProposals) * 100 : 0;

    // Get top keywords
    const allKeywords: Record<string, number> = {};
    analytics.forEach((a) => {
      if (a.topKeywords) {
        const keywords = a.topKeywords as any[];
        keywords.forEach((kw: any) => {
          allKeywords[kw.keyword] = (allKeywords[kw.keyword] || 0) + kw.count;
        });
      }
    });

    const topKeywords = Object.entries(allKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }));

    // Get top skills
    const allSkills: Record<string, number> = {};
    analytics.forEach((a) => {
      if (a.topSkills) {
        const skills = a.topSkills as any[];
        skills.forEach((skill: any) => {
          allSkills[skill.name] = (allSkills[skill.name] || 0) + skill.views;
        });
      }
    });

    const topSkills = Object.entries(allSkills)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, views]) => ({ name, views }));

    // Earnings by month
    const earningsByMonth: Record<string, number> = {};
    analytics.forEach((a) => {
      const month = new Date(a.date).toISOString().substring(0, 7); // YYYY-MM
      earningsByMonth[month] =
        (earningsByMonth[month] || 0) + parseFloat(a.earnings.toString());
    });

    return {
      summary: {
        totalViews,
        totalProposals,
        totalAccepted,
        acceptanceRate: acceptanceRate.toFixed(2),
        totalEarnings,
      },
      trends: {
        profileViews: analytics.map((a) => ({
          date: a.date,
          value: a.profileViews,
        })),
        proposals: analytics.map((a) => ({
          date: a.date,
          sent: a.proposalsSent,
          accepted: a.proposalsAccepted,
        })),
        earnings: analytics.map((a) => ({
          date: a.date,
          value: parseFloat(a.earnings.toString()),
        })),
      },
      topKeywords,
      topSkills,
      earningsByMonth: Object.entries(earningsByMonth).map(
        ([month, earnings]) => ({ month, earnings }),
      ),
    };
  }

  /**
   * Track profile view
   */
  async trackProfileView(engineerProfileId: string, searchKeyword?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await this.prisma.engineerAnalytics.upsert({
      where: {
        engineerProfileId_date: {
          engineerProfileId,
          date: today,
        },
      },
      create: {
        engineerProfileId,
        date: today,
        profileViews: 1,
        topKeywords: searchKeyword
          ? [{ keyword: searchKeyword, count: 1 }]
          : undefined,
      },
      update: {
        profileViews: { increment: 1 },
      },
    });

    // Update keyword if provided
    if (searchKeyword && analytics.topKeywords) {
      const keywords = analytics.topKeywords as any[];
      const existing = keywords.find((k: any) => k.keyword === searchKeyword);

      if (existing) {
        existing.count++;
      } else {
        keywords.push({ keyword: searchKeyword, count: 1 });
      }

      await this.prisma.engineerAnalytics.update({
        where: { id: analytics.id },
        data: { topKeywords: keywords },
      });
    }

    return analytics;
  }

  /**
   * Track proposal sent
   */
  async trackProposalSent(engineerProfileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.engineerAnalytics.upsert({
      where: {
        engineerProfileId_date: {
          engineerProfileId,
          date: today,
        },
      },
      create: {
        engineerProfileId,
        date: today,
        proposalsSent: 1,
      },
      update: {
        proposalsSent: { increment: 1 },
      },
    });
  }

  /**
   * Track proposal accepted
   */
  async trackProposalAccepted(engineerProfileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.engineerAnalytics.upsert({
      where: {
        engineerProfileId_date: {
          engineerProfileId,
          date: today,
        },
      },
      create: {
        engineerProfileId,
        date: today,
        proposalsAccepted: 1,
      },
      update: {
        proposalsAccepted: { increment: 1 },
      },
    });
  }

  /**
   * Track earnings
   */
  async trackEarnings(engineerProfileId: string, amount: number, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    return await this.prisma.engineerAnalytics.upsert({
      where: {
        engineerProfileId_date: {
          engineerProfileId,
          date: targetDate,
        },
      },
      create: {
        engineerProfileId,
        date: targetDate,
        earnings: amount,
      },
      update: {
        earnings: { increment: amount },
      },
    });
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(
    companyProfileId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const analytics = await this.prisma.companyAnalytics.findMany({
      where: {
        companyProfileId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: "asc" },
    });

    // Calculate aggregates
    const totalJobsPosted = analytics.reduce((sum, a) => sum + a.jobsPosted, 0);
    const totalApplications = analytics.reduce(
      (sum, a) => sum + a.applicationsReceived,
      0,
    );
    const totalHires = analytics.reduce((sum, a) => sum + a.hiresMade, 0);
    const totalSpent = analytics.reduce(
      (sum, a) => sum + parseFloat(a.totalSpent.toString()),
      0,
    );

    // Calculate average time to hire
    const timeToHireValues = analytics
      .filter((a) => a.avgTimeToHire)
      .map((a) => parseFloat(a.avgTimeToHire!.toString()));

    const avgTimeToHire =
      timeToHireValues.length > 0
        ? timeToHireValues.reduce((sum, val) => sum + val, 0) /
          timeToHireValues.length
        : 0;

    // Cost per hire
    const costPerHire = totalHires > 0 ? totalSpent / totalHires : 0;

    // Get engineer performance data
    const performanceData: any[] = [];
    analytics.forEach((a) => {
      if (a.engineerPerformance) {
        const perf = a.engineerPerformance as any[];
        performanceData.push(...perf);
      }
    });

    // Get market rate benchmarks
    const marketRates: any[] = [];
    analytics.forEach((a) => {
      if (a.marketRateBenchmark) {
        const rates = a.marketRateBenchmark as any[];
        marketRates.push(...rates);
      }
    });

    return {
      summary: {
        totalJobsPosted,
        totalApplications,
        totalHires,
        avgTimeToHire: avgTimeToHire.toFixed(1),
        totalSpent,
        costPerHire: costPerHire.toFixed(2),
      },
      trends: {
        jobsPosted: analytics.map((a) => ({
          date: a.date,
          value: a.jobsPosted,
        })),
        applications: analytics.map((a) => ({
          date: a.date,
          value: a.applicationsReceived,
        })),
        hires: analytics.map((a) => ({ date: a.date, value: a.hiresMade })),
        spending: analytics.map((a) => ({
          date: a.date,
          value: parseFloat(a.totalSpent.toString()),
        })),
      },
      engineerPerformance: performanceData,
      marketRateBenchmark: marketRates,
    };
  }

  /**
   * Track job posted
   */
  async trackJobPosted(companyProfileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.companyAnalytics.upsert({
      where: {
        companyProfileId_date: {
          companyProfileId,
          date: today,
        },
      },
      create: {
        companyProfileId,
        date: today,
        jobsPosted: 1,
      },
      update: {
        jobsPosted: { increment: 1 },
      },
    });
  }

  /**
   * Track application received
   */
  async trackApplicationReceived(companyProfileId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.prisma.companyAnalytics.upsert({
      where: {
        companyProfileId_date: {
          companyProfileId,
          date: today,
        },
      },
      create: {
        companyProfileId,
        date: today,
        applicationsReceived: 1,
      },
      update: {
        applicationsReceived: { increment: 1 },
      },
    });
  }

  /**
   * Track hire made
   */
  async trackHireMade(
    companyProfileId: string,
    timeToHire: number,
    amount: number,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.companyAnalytics.findUnique({
      where: {
        companyProfileId_date: {
          companyProfileId,
          date: today,
        },
      },
    });

    if (existing) {
      // Calculate new average time to hire
      const currentTotal =
        parseFloat(existing.avgTimeToHire?.toString() || "0") *
        existing.hiresMade;
      const newTotal = currentTotal + timeToHire;
      const newAvg = newTotal / (existing.hiresMade + 1);

      return await this.prisma.companyAnalytics.update({
        where: { id: existing.id },
        data: {
          hiresMade: { increment: 1 },
          avgTimeToHire: newAvg,
          totalSpent: { increment: amount },
        },
      });
    } else {
      return await this.prisma.companyAnalytics.create({
        data: {
          companyProfileId,
          date: today,
          hiresMade: 1,
          avgTimeToHire: timeToHire,
          totalSpent: amount,
        },
      });
    }
  }
}
