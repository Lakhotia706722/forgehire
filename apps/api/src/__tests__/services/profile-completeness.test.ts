import { ProfileCompletenessService } from '../../services/profile-completeness.service';
import { getPrismaClient } from '../../config/database';

jest.mock('../../config/database');

describe('ProfileCompletenessService', () => {
  let service: ProfileCompletenessService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      engineerProfile: {
        findUnique: jest.fn(),
        update: jest.fn()
      }
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
    service = new ProfileCompletenessService();
  });

  describe('calculateCompleteness', () => {
    it('should calculate 0% for empty profile', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: false,
        skillsComplete: false,
        experienceComplete: false,
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [],
        projects: [],
        experiences: []
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      expect(result.score).toBe(0);
      expect(result.canAccessAssessment).toBe(false);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('should calculate 100% for complete profile', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: true,
        skillsComplete: true,
        experienceComplete: true,
        projectsComplete: true,
        pricingComplete: true,
        paymentComplete: true,
        kycComplete: true,
        kycVerified: true,
        upiId: 'test@upi',
        skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
        projects: [{ id: '1' }, { id: '2' }],
        experiences: [{ id: '1' }]
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      expect(result.score).toBe(100);
      expect(result.canAccessAssessment).toBe(true);
      expect(result.missingFields.length).toBe(0);
    });

    it('should calculate 70% threshold correctly', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: true, // 15%
        skillsComplete: true, // 20%
        experienceComplete: true, // 15%
        projectsComplete: true, // 25%
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
        projects: [{ id: '1' }, { id: '2' }],
        experiences: [{ id: '1' }]
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      expect(result.score).toBe(75); // 15 + 20 + 15 + 25
      expect(result.canAccessAssessment).toBe(true);
    });

    it('should not allow assessment access below 70%', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: true, // 15%
        skillsComplete: true, // 20%
        experienceComplete: true, // 15%
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
        projects: [],
        experiences: [{ id: '1' }]
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      expect(result.score).toBe(50); // 15 + 20 + 15
      expect(result.canAccessAssessment).toBe(false);
    });

    it('should handle partial skills completion', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: false,
        skillsComplete: false,
        experienceComplete: false,
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [{ id: '1' }], // Only 1 skill, need 3
        projects: [],
        experiences: []
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      // Should get partial credit for 1/3 skills
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(20);
      expect(result.missingFields).toContain('More Skills');
    });

    it('should handle partial projects completion', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: false,
        skillsComplete: false,
        experienceComplete: false,
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [],
        projects: [{ id: '1' }], // Only 1 project, need 2
        experiences: []
      });

      mockPrisma.engineerProfile.update.mockResolvedValue({});

      const result = await service.calculateCompleteness('profile-1');

      // Should get partial credit for 1/2 projects
      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThan(25);
      expect(result.missingFields).toContain('More Projects');
    });
  });

  describe('updateStepCompletion', () => {
    it('should update basic info step', async () => {
      mockPrisma.engineerProfile.update.mockResolvedValue({});
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        id: 'profile-1',
        basicInfoComplete: true,
        skillsComplete: false,
        experienceComplete: false,
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        skills: [],
        projects: [],
        experiences: []
      });

      await service.updateStepCompletion('profile-1', 'basicInfo', true);

      expect(mockPrisma.engineerProfile.update).toHaveBeenCalledWith({
        where: { id: 'profile-1' },
        data: { basicInfoComplete: true }
      });
    });

    it('should throw error for invalid step', async () => {
      await expect(
        service.updateStepCompletion('profile-1', 'invalidStep', true)
      ).rejects.toThrow('Invalid step');
    });
  });

  describe('getBuilderProgress', () => {
    it('should return progress with all steps', async () => {
      mockPrisma.engineerProfile.findUnique.mockResolvedValue({
        basicInfoComplete: true,
        skillsComplete: true,
        experienceComplete: false,
        projectsComplete: false,
        pricingComplete: false,
        paymentComplete: false,
        kycComplete: false,
        completenessScore: 35
      });

      const progress = await service.getBuilderProgress('profile-1');

      expect(progress.steps).toHaveLength(7);
      expect(progress.completedSteps).toBe(2);
      expect(progress.totalSteps).toBe(7);
      expect(progress.completenessScore).toBe(35);
      expect(progress.canAccessAssessment).toBe(false);
    });
  });
});
