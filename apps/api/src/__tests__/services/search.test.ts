import { SearchService } from "../../services/search.service";
import { getTypesenseClient } from "../../config/typesense";

jest.mock("../../config/typesense");
jest.mock("../../config/env", () => ({
  ...jest.requireActual("../../config/env"),
  isTypesenseEnabled: jest.fn(() => true),
}));

describe("SearchService", () => {
  let service: SearchService;
  let mockTypesense: any;

  beforeEach(() => {
    mockTypesense = {
      collections: jest.fn().mockReturnValue({
        documents: jest.fn().mockReturnValue({
          search: jest.fn(),
        }),
      }),
    };

    (getTypesenseClient as jest.Mock).mockReturnValue(mockTypesense);
    service = new SearchService();
  });

  describe("searchEngineers", () => {
    it("should search with skill filter", async () => {
      const mockResults = {
        hits: [
          {
            document: {
              id: "1",
              fullName: "John Doe",
              skills: ["Python", "TensorFlow"],
              neuronScore: 85,
            },
          },
        ],
        found: 1,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      const results = await service.searchEngineers({
        skills: ["Python"],
        limit: 20,
      });

      expect(results.results).toHaveLength(1);
      expect(results.total).toBe(1);
      expect(mockTypesense.collections).toHaveBeenCalledWith(
        "engineer_profiles",
      );
    });

    it("should filter by NeuronScore range", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchEngineers({
        minNeuronScore: 80,
        maxNeuronScore: 95,
        limit: 20,
      });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain("neuronScore:>=80");
      expect(searchCall.filter_by).toContain("neuronScore:<=95");
    });

    it("should filter by availability status", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchEngineers({
        availabilityStatus: "available_now",
        limit: 20,
      });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain(
        "availabilityStatus:=available_now",
      );
    });

    it("should filter by hourly rate range", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchEngineers({
        minHourlyRate: 50,
        maxHourlyRate: 100,
        limit: 20,
      });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain("hourlyRate:>=50");
      expect(searchCall.filter_by).toContain("hourlyRate:<=100");
    });

    it("should only show profiles with 70%+ completeness", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchEngineers({ limit: 20 });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain("completenessScore:>=70");
    });

    it("should handle pagination with cursor", async () => {
      const mockResults = {
        hits: [],
        found: 100,
        page: 2,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      const results = await service.searchEngineers({
        cursor: "2",
        limit: 20,
      });

      expect(results.page).toBe(2);
      expect(results.nextCursor).toBe("3");
    });

    it("should return null cursor on last page", async () => {
      const mockResults = {
        hits: [],
        found: 20,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      const results = await service.searchEngineers({ limit: 20 });

      expect(results.nextCursor).toBeNull();
    });
  });

  describe("searchCompanies", () => {
    it("should search with industry filter", async () => {
      const mockResults = {
        hits: [
          {
            document: {
              id: "1",
              companyName: "Tech Corp",
              industry: "Technology",
              trustScore: 85,
            },
          },
        ],
        found: 1,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      const results = await service.searchCompanies({
        industry: "Technology",
        limit: 20,
      });

      expect(results.results).toHaveLength(1);
      expect(results.total).toBe(1);
    });

    it("should filter by hiring status", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchCompanies({
        isHiring: true,
        limit: 20,
      });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain("isHiring:=true");
    });

    it("should filter by minimum trust score", async () => {
      const mockResults = {
        hits: [],
        found: 0,
        page: 1,
      };

      mockTypesense
        .collections()
        .documents()
        .search.mockResolvedValue(mockResults);

      await service.searchCompanies({
        minTrustScore: 70,
        limit: 20,
      });

      const searchCall = mockTypesense.collections().documents().search.mock
        .calls[0][0];
      expect(searchCall.filter_by).toContain("trustScore:>=70");
    });
  });
});
