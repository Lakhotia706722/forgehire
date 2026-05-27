import { FastifyInstance } from "fastify";
import { SearchService } from "../services/search.service";
import { successResponse } from "@neuronhire/shared";
import { authenticate } from "../middleware/auth";
import { engineerSearchSchema, companySearchSchema } from "@neuronhire/shared";

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {
  const searchService = new SearchService();

  // Search engineers
  fastify.get(
    "/engineers",
    {
      preHandler: [authenticate],
    },
    async (request: any, _reply) => {
      const params = engineerSearchSchema.parse(request.query);
      const results = await searchService.searchEngineers(params);

      return successResponse(results.results, {
        pagination: {
          page: results.page,
          limit: params.limit,
          total: results.total,
          totalPages: Math.ceil(results.total / params.limit),
        },
        nextCursor: results.nextCursor,
      });
    },
  );

  // Search companies
  fastify.get(
    "/companies",
    {
      preHandler: [authenticate],
    },
    async (request: any, _reply) => {
      const params = companySearchSchema.parse(request.query);
      const results = await searchService.searchCompanies(params);

      return successResponse(results.results, {
        pagination: {
          page: results.page,
          limit: params.limit,
          total: results.total,
          totalPages: Math.ceil(results.total / params.limit),
        },
        nextCursor: results.nextCursor,
      });
    },
  );

  // Get engineer facets
  fastify.get(
    "/engineers/facets",
    {
      preHandler: [authenticate],
    },
    async (_request: any, _reply) => {
      const facets = await searchService.getEngineerFacets();
      return successResponse({ facets });
    },
  );

  // Get company facets
  fastify.get(
    "/companies/facets",
    {
      preHandler: [authenticate],
    },
    async (_request: any, _reply) => {
      const facets = await searchService.getCompanyFacets();
      return successResponse({ facets });
    },
  );
}
