import { EngineerProfileService } from '../../services/engineer-profile.service';
import { SearchService } from '../../services/search.service';
import { getPrismaClient } from '../../config/database';
import { getTypesenseClient } from '../../config/typesense';

jest.mock('../../config/database');
jest.mock('../../config/typesense');

describe('Profile Flow Integration', () => {
  let profileService: EngineerProfileService;
  let searchService: SearchService;
  let mockPrisma: any;
  let mockTypesense: any;

  beforeEach(() => {
    mockPrisma = {
      engineerProfile: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn()
      },
      engineerSkill: {
        create: jest.fn(),
        count: jest.fn()
      },
      engineerProject: {
        create: jest.fn(),
        count: jest.fn()
      }
    };

    const mockDocuments = {
      upsert: jest.fn().mockResolvedValue({}),
      search: jest.fn()
    };
    const mockCollection = {
      documents: jest.fn().mockReturnValue(mockDocuments)
    };

    mockTypesense = {
      collections: jest.fn().mockReturnValue(mockCollection)
    };

    (getPrismaClient as jest.Mock).mockReturnValue(mockPrisma);
    (getTypesenseClient as jest.Mock).mockReturnValue(mockTypesense);

    profileService = new EngineerProfileService();
    searchService = new SearchService();
  });

  it('should complete full profile creation flow', async () => {
    const userId = 'user-123';

    // Step 1: Create profile
    mockPrisma.engineerProfile.findUnique.mockResolvedValue(null);
    mockPrisma.engineerProfile.create.mockResolvedValue({
      id: 'profile-123',
      userId,
      fullName: '',
      completenessScore: 0,
      skills: [],
      projects: [],
      experiences: []
    });

    const profile = await profileService.getOrCreateProfile(userId);
    expect(profile.id).toBe('profile-123');

    // Step 2: Update basic info
    const updatedProfile = {
      ...profile,
      fullName: 'John Doe',
      bio: 'AI Engineer',
      basicInfoComplete: true,
      neuronScore: 0,
      neuronTier: 'conditional',
      availabilityStatus: 'available_now',
      hourlyRate: null,
      yearsOfExperience: null,
      completenessScore: 20,
      createdAt: new Date(),
      skills: []
    };
    mockPrisma.engineerProfile.findUnique.mockResolvedValue(updatedProfile);
    mockPrisma.engineerProfile.update.mockResolvedValue(updatedProfile);

    await profileService.updateBasicInfo(userId, {
      fullName: 'John Doe',
      bio: 'AI Engineer'
    });

    // Step 3: Add skills
    mockPrisma.engineerSkill.create.mockResolvedValue({
      id: 'skill-1',
      engineerProfileId: profile.id,
      skillName: 'Python',
      proficiencyLevel: 'expert'
    });
    mockPrisma.engineerSkill.count.mockResolvedValue(3);
    // indexProfile will call findUnique again — return profile with skills
    mockPrisma.engineerProfile.findUnique.mockResolvedValue({
      ...updatedProfile,
      skills: [{ skillName: 'Python' }]
    });

    await profileService.addSkill(userId, {
      skillName: 'Python',
      proficiencyLevel: 'expert',
      projectCount: 0,
      verified: false
    });

    // Step 4: Add projects
    mockPrisma.engineerProject.create.mockResolvedValue({
      id: 'project-1',
      engineerProfileId: profile.id,
      title: 'AI Chatbot',
      description: 'Built a chatbot',
      problemSolved: 'Customer support automation',
      techStack: ['Python', 'TensorFlow']
    });
    mockPrisma.engineerProject.count.mockResolvedValue(2);

    await profileService.addProject(userId, {
      title: 'AI Chatbot',
      description: 'Built a chatbot',
      problemSolved: 'Customer support automation',
      techStack: ['Python', 'TensorFlow'],
      featured: false
    });

    // Verify Typesense indexing was called
    expect(mockTypesense.collections('engineer_profiles').documents().upsert).toHaveBeenCalled();
  });

  it('should search and retrieve created profile', async () => {
    // Mock search results
    mockTypesense.collections().documents().search.mockResolvedValue({
      hits: [
        {
          document: {
            id: 'profile-123',
            fullName: 'John Doe',
            skills: ['Python', 'TensorFlow'],
            neuronScore: 85,
            completenessScore: 75
          }
        }
      ],
      found: 1,
      page: 1
    });

    const results = await searchService.searchEngineers({
      skills: ['Python'],
      limit: 20
    });

    expect(results.results).toHaveLength(1);
    expect(results.results[0].fullName).toBe('John Doe');
    expect(results.results[0].skills).toContain('Python');
  });

  it('should block assessment access when completeness < 70%', async () => {
    mockPrisma.engineerProfile.findUnique.mockResolvedValue({
      id: 'profile-123',
      basicInfoComplete: true,
      skillsComplete: true,
      experienceComplete: false,
      projectsComplete: false,
      pricingComplete: false,
      paymentComplete: false,
      kycComplete: false,
      completenessScore: 35,
      skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
      projects: [],
      experiences: []
    });

    mockPrisma.engineerProfile.update.mockResolvedValue({});

    const profile = await profileService.getFullProfile('user-123');

    expect(profile?.completeness.canAccessAssessment).toBe(false);
    expect(profile?.completeness.score).toBeLessThan(70);
  });

  it('should allow assessment access when completeness >= 70%', async () => {
    mockPrisma.engineerProfile.findUnique.mockResolvedValue({
      id: 'profile-123',
      basicInfoComplete: true,
      skillsComplete: true,
      experienceComplete: true,
      projectsComplete: true,
      pricingComplete: false,
      paymentComplete: false,
      kycComplete: false,
      completenessScore: 75,
      skills: [{ id: '1' }, { id: '2' }, { id: '3' }],
      projects: [{ id: '1' }, { id: '2' }],
      experiences: [{ id: '1' }]
    });

    mockPrisma.engineerProfile.update.mockResolvedValue({});

    const profile = await profileService.getFullProfile('user-123');

    expect(profile?.completeness.canAccessAssessment).toBe(true);
    expect(profile?.completeness.score).toBeGreaterThanOrEqual(70);
  });
});
