import { getTypesenseClient } from "../config/typesense";
import { isTypesenseEnabled } from "../config/env";
import { getPrismaClient } from "../config/database";
import { EngineerSearchInput, CompanySearchInput } from "@neuronhire/shared";
import { Prisma } from "@prisma/client";

const emptySearchResult = {
  results: [] as unknown[],
  total: 0,
  page: 1,
  nextCursor: null as string | null,
};

export class SearchService {
  private prisma = getPrismaClient();

  /**
   * Search engineer profiles with filters
   */
  async searchEngineers(params: EngineerSearchInput) {
    if (!isTypesenseEnabled()) {
      return this.searchEngineersPrisma(params);
    }

    const typesense = getTypesenseClient();
    const {
      skills,
      minNeuronScore,
      maxNeuronScore,
      availabilityStatus,
      minHourlyRate,
      maxHourlyRate,
      location,
      neuronTier,
      query,
      cursor,
      limit = 20,
    } = params;

    const filters: string[] = [];

    if (skills && skills.length > 0) {
      const skillFilters = skills
        .map((skill) => `skills:=${skill}`)
        .join(" || ");
      filters.push(`(${skillFilters})`);
    }

    if (minNeuronScore !== undefined) {
      filters.push(`neuronScore:>=${minNeuronScore}`);
    }

    if (maxNeuronScore !== undefined) {
      filters.push(`neuronScore:<=${maxNeuronScore}`);
    }

    if (availabilityStatus) {
      filters.push(`availabilityStatus:=${availabilityStatus}`);
    }

    if (minHourlyRate !== undefined) {
      filters.push(`hourlyRate:>=${minHourlyRate}`);
    }

    if (maxHourlyRate !== undefined) {
      filters.push(`hourlyRate:<=${maxHourlyRate}`);
    }

    if (location) {
      filters.push(`location:=${location}`);
    }

    if (neuronTier) {
      filters.push(`neuronTier:=${neuronTier}`);
    }

    filters.push("completenessScore:>=70");

    const searchParams: Record<string, unknown> = {
      q: query || "*",
      query_by: "fullName,bio,skills",
      filter_by: filters.join(" && "),
      sort_by: "neuronScore:desc",
      per_page: limit,
    };

    if (cursor) {
      searchParams.page = parseInt(cursor, 10);
    }

    try {
      const results = await typesense
        .collections("engineer_profiles")
        .documents()
        .search(searchParams);

      const hits = results.hits || [];
      const documents = hits.map((hit: { document?: unknown }) => hit.document);

      return {
        results: documents,
        total: results.found || 0,
        page: results.page || 1,
        nextCursor:
          results.page < Math.ceil((results.found || 0) / limit)
            ? (results.page + 1).toString()
            : null,
      };
    } catch (error) {
      console.error("Engineer search error:", error);
      return this.searchEngineersPrisma(params);
    }
  }

  private async searchEngineersPrisma(params: EngineerSearchInput) {
    const {
      skills,
      minNeuronScore,
      maxNeuronScore,
      availabilityStatus,
      minHourlyRate,
      maxHourlyRate,
      location,
      neuronTier,
      query,
      cursor,
      limit = 20,
    } = params;

    const page = cursor ? parseInt(cursor, 10) : 1;
    const skip = (page - 1) * limit;

    const where: Prisma.EngineerProfileWhereInput = {
      completenessScore: { gte: 70 },
    };

    if (query) {
      where.OR = [
        { fullName: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        { headline: { contains: query, mode: "insensitive" } },
      ];
    }
    if (minNeuronScore !== undefined) {
      where.neuronScore = { ...(where.neuronScore as object), gte: minNeuronScore };
    }
    if (maxNeuronScore !== undefined) {
      where.neuronScore = { ...(where.neuronScore as object), lte: maxNeuronScore };
    }
    if (availabilityStatus) where.availabilityStatus = availabilityStatus;
    if (neuronTier) where.neuronTier = neuronTier;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (minHourlyRate !== undefined || maxHourlyRate !== undefined) {
      where.hourlyRate = {};
      if (minHourlyRate !== undefined) {
        (where.hourlyRate as Prisma.DecimalNullableFilter).gte = minHourlyRate;
      }
      if (maxHourlyRate !== undefined) {
        (where.hourlyRate as Prisma.DecimalNullableFilter).lte = maxHourlyRate;
      }
    }
    if (skills?.length) {
      where.skills = { some: { skillName: { in: skills } } };
    }

    const [profiles, total] = await Promise.all([
      this.prisma.engineerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { neuronScore: "desc" },
        include: {
          skills: { select: { skillName: true } },
          _count: { select: { projects: true } },
        },
      }),
      this.prisma.engineerProfile.count({ where }),
    ]);

    const results = profiles.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      bio: p.bio,
      headline: p.headline,
      location: p.location,
      neuronScore: p.neuronScore,
      neuronTier: p.neuronTier,
      hourlyRate: p.hourlyRate ? Number(p.hourlyRate) : null,
      availabilityStatus: p.availabilityStatus,
      completenessScore: p.completenessScore,
      skills: p.skills.map((s) => s.skillName),
      projectCount: p._count.projects,
    }));

    const totalPages = Math.ceil(total / limit);
    return {
      results,
      total,
      page,
      nextCursor: page < totalPages ? String(page + 1) : null,
    };
  }

  /**
   * Search company profiles with filters
   */
  async searchCompanies(params: CompanySearchInput) {
    if (!isTypesenseEnabled()) {
      return this.searchCompaniesPrisma(params);
    }

    const typesense = getTypesenseClient();
    const { industry, isHiring, minTrustScore, query, cursor, limit = 20 } =
      params;

    const filters: string[] = [];

    if (industry) {
      filters.push(`industry:=${industry}`);
    }

    if (isHiring !== undefined) {
      filters.push(`isHiring:=${isHiring}`);
    }

    if (minTrustScore !== undefined) {
      filters.push(`trustScore:>=${minTrustScore}`);
    }

    const searchParams: Record<string, unknown> = {
      q: query || "*",
      query_by: "companyName,description",
      filter_by: filters.length > 0 ? filters.join(" && ") : undefined,
      sort_by: "trustScore:desc",
      per_page: limit,
    };

    if (cursor) {
      searchParams.page = parseInt(cursor, 10);
    }

    try {
      const results = await typesense
        .collections("company_profiles")
        .documents()
        .search(searchParams);

      const hits = results.hits || [];
      const documents = hits.map((hit: { document?: unknown }) => hit.document);

      return {
        results: documents,
        total: results.found || 0,
        page: results.page || 1,
        nextCursor:
          results.page < Math.ceil((results.found || 0) / limit)
            ? (results.page + 1).toString()
            : null,
      };
    } catch (error) {
      console.error("Company search error:", error);
      return this.searchCompaniesPrisma(params);
    }
  }

  private async searchCompaniesPrisma(params: CompanySearchInput) {
    const { industry, isHiring, minTrustScore, query, cursor, limit = 20 } =
      params;

    const page = cursor ? parseInt(cursor, 10) : 1;
    const skip = (page - 1) * limit;

    const where: Prisma.CompanyProfileWhereInput = {};
    if (query) {
      where.OR = [
        { companyName: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }
    if (industry) where.industry = industry;
    if (isHiring !== undefined) where.isHiring = isHiring;
    if (minTrustScore !== undefined) where.trustScore = { gte: minTrustScore };

    const [profiles, total] = await Promise.all([
      this.prisma.companyProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { trustScore: "desc" },
      }),
      this.prisma.companyProfile.count({ where }),
    ]);

    const results = profiles.map((p) => ({
      id: p.id,
      companyName: p.companyName,
      description: p.description,
      industry: p.industry,
      trustScore: p.trustScore,
      isHiring: p.isHiring,
      location: p.location,
      logoUrl: p.logoUrl,
    }));

    const totalPages = Math.ceil(total / limit);
    return {
      results,
      total,
      page,
      nextCursor: page < totalPages ? String(page + 1) : null,
    };
  }

  /**
   * Get facets for filtering
   */
  async getEngineerFacets() {
    if (!isTypesenseEnabled()) {
      return [];
    }

    try {
      const typesense = getTypesenseClient();
      const results = await typesense
        .collections("engineer_profiles")
        .documents()
        .search({
          q: "*",
          query_by: "fullName",
          facet_by: "skills,neuronTier,availabilityStatus,location",
          per_page: 0,
        });

      return results.facet_counts || [];
    } catch (error) {
      console.error("Facets error:", error);
      return [];
    }
  }

  /**
   * Get company facets for filtering
   */
  async getCompanyFacets() {
    if (!isTypesenseEnabled()) {
      return [];
    }

    try {
      const typesense = getTypesenseClient();
      const results = await typesense
        .collections("company_profiles")
        .documents()
        .search({
          q: "*",
          query_by: "companyName",
          facet_by: "industry,isHiring,hiringIntents,aiRequirements",
          per_page: 0,
        });

      return results.facet_counts || [];
    } catch (error) {
      console.error("Facets error:", error);
      return [];
    }
  }
}
