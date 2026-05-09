import { FastifyInstance } from 'fastify';
import { getPrismaClient } from '../config/database';
import { redis } from '../config/redis';

export async function featuredRoutes(fastify: FastifyInstance) {
  const prisma = getPrismaClient();
  // Featured engineers (for landing page)
  fastify.get('/engineers', async (request, reply) => {
    const cacheKey = 'featured:engineers';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return reply.send(JSON.parse(cached));
    }

    const engineers = await prisma.engineerProfile.findMany({
      where: {
        neuronTier: { in: ['elite', 'professional'] },
        completenessScore: { gte: 70 },
      },
      orderBy: { neuronScore: 'desc' },
      take: 6,
      include: {
        user: { select: { email: true } },
        skills: {
          take: 5,
          orderBy: { proficiencyLevel: 'desc' },
          select: { skillName: true, proficiencyLevel: true },
        },
        _count: {
          select: {
            contracts: true,
            products: true,
          },
        },
      },
    });

    // Get average rating for each engineer
    const engineersWithRatings = await Promise.all(
      engineers.map(async (eng) => {
        // Get contracts where this engineer worked
        const contracts = await prisma.contract.findMany({
          where: {
            engineerProfileId: eng.id,
            status: 'completed',
          },
          select: { id: true },
        });

        // For now, we'll use a placeholder rating system
        // In production, you'd have a reviews table
        const rating = eng.neuronScore >= 700 ? 4.8 : eng.neuronScore >= 600 ? 4.5 : 4.2;
        const reviewCount = contracts.length;

        return {
          id: eng.id,
          name: eng.fullName,
          headline: eng.bio?.substring(0, 100) || '',
          location: eng.location,
          neuronScore: eng.neuronScore,
          neuronTier: eng.neuronTier,
          hourlyRate: Number(eng.hourlyRate || 0),
          availabilityStatus: eng.availabilityStatus,
          skills: eng.skills.map(s => s.skillName),
          rating,
          reviewCount,
          completedProjects: eng._count.contracts,
          productsPublished: eng._count.products,
        };
      })
    );

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(engineersWithRatings));
    return reply.send(engineersWithRatings);
  });

  // Featured marketplace products (for landing page)
  fastify.get('/products', async (request, reply) => {
    const cacheKey = 'featured:products';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return reply.send(JSON.parse(cached));
    }

    const products = await prisma.product.findMany({
      where: { status: 'published' },
      orderBy: { purchaseCount: 'desc' },
      take: 3,
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true,
          },
        },
      },
    });

    const result = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      category: p.category,
      thumbnailUrl: p.thumbnailUrl,
      priceINR: Number(p.priceINR || 0),
      pricingModel: p.pricingModel,
      rating: Number(p.rating || 0),
      reviewCount: p.reviewCount,
      purchaseCount: p.purchaseCount,
      engineer: {
        name: p.engineerProfile.fullName,
        neuronScore: p.engineerProfile.neuronScore,
        tier: p.engineerProfile.neuronTier,
      },
    }));

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(result));
    return reply.send(result);
  });

  // Featured bounties/tasks (for landing page)
  fastify.get('/bounties', async (request, reply) => {
    const cacheKey = 'featured:bounties';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return reply.send(JSON.parse(cached));
    }

    const tasks = await prisma.task.findMany({
      where: { status: 'open' },
      orderBy: { rewardAmount: 'desc' },
      take: 3,
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true,
            trustScore: true,
          },
        },
      },
    });

    const result = tasks.map(t => {
      const daysLeft = t.deadline
        ? Math.ceil((t.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        id: t.id,
        title: t.title,
        type: t.type,
        category: t.category,
        rewardAmount: Number(t.rewardAmount),
        difficulty: t.difficulty,
        minNeuronScore: t.minNeuronScore,
        participantCount: t.participantCount,
        daysLeft,
        company: {
          name: t.companyProfile.companyName,
          logoUrl: t.companyProfile.logoUrl,
          trustScore: t.companyProfile.trustScore,
        },
      };
    });

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(result));
    return reply.send(result);
  });
}
