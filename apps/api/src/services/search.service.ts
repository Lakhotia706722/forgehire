import { getTypesenseClient } from '../config/typesense';
import { EngineerSearchInput, CompanySearchInput } from '@neuronhire/shared';

export class SearchService {
  private typesense = getTypesenseClient();

  /**
   * Search engineer profiles with filters
   */
  async searchEngineers(params: EngineerSearchInput) {
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
      limit = 20
    } = params;

    // Build filter query
    const filters: string[] = [];

    if (skills && skills.length > 0) {
      const skillFilters = skills.map(skill => `skills:=${skill}`).join(' || ');
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

    // Only show profiles with at least 70% completeness
    filters.push('completenessScore:>=70');

    const searchParams: any = {
      q: query || '*',
      query_by: 'fullName,bio,skills',
      filter_by: filters.join(' && '),
      sort_by: 'neuronScore:desc',
      per_page: limit
    };

    if (cursor) {
      searchParams.page = parseInt(cursor);
    }

    try {
      const results = await this.typesense
        .collections('engineer_profiles')
        .documents()
        .search(searchParams);

      const hits = results.hits || [];
      const documents = hits.map((hit: any) => hit.document);

      return {
        results: documents,
        total: results.found || 0,
        page: results.page || 1,
        nextCursor: results.page < Math.ceil((results.found || 0) / limit)
          ? (results.page + 1).toString()
          : null
      };
    } catch (error) {
      console.error('Engineer search error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Search company profiles with filters
   */
  async searchCompanies(params: CompanySearchInput) {
    const {
      industry,
      isHiring,
      minTrustScore,
      query,
      cursor,
      limit = 20
    } = params;

    // Build filter query
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

    const searchParams: any = {
      q: query || '*',
      query_by: 'companyName,description',
      filter_by: filters.length > 0 ? filters.join(' && ') : undefined,
      sort_by: 'trustScore:desc',
      per_page: limit
    };

    if (cursor) {
      searchParams.page = parseInt(cursor);
    }

    try {
      const results = await this.typesense
        .collections('company_profiles')
        .documents()
        .search(searchParams);

      const hits = results.hits || [];
      const documents = hits.map((hit: any) => hit.document);

      return {
        results: documents,
        total: results.found || 0,
        page: results.page || 1,
        nextCursor: results.page < Math.ceil((results.found || 0) / limit)
          ? (results.page + 1).toString()
          : null
      };
    } catch (error) {
      console.error('Company search error:', error);
      throw new Error('Search failed');
    }
  }

  /**
   * Get facets for filtering
   */
  async getEngineerFacets() {
    try {
      const results = await this.typesense
        .collections('engineer_profiles')
        .documents()
        .search({
          q: '*',
          query_by: 'fullName',
          facet_by: 'skills,neuronTier,availabilityStatus,location',
          per_page: 0
        });

      return results.facet_counts || [];
    } catch (error) {
      console.error('Facets error:', error);
      return [];
    }
  }

  /**
   * Get company facets for filtering
   */
  async getCompanyFacets() {
    try {
      const results = await this.typesense
        .collections('company_profiles')
        .documents()
        .search({
          q: '*',
          query_by: 'companyName',
          facet_by: 'industry,isHiring,hiringIntents,aiRequirements',
          per_page: 0
        });

      return results.facet_counts || [];
    } catch (error) {
      console.error('Facets error:', error);
      return [];
    }
  }
}
