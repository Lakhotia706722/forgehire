import { PrismaClient, ProductStatus, Prisma } from '@prisma/client';
import { ProductModerationService } from './product-moderation.service';
import {
  CreateProductInput,
  UpdateProductInput,
  PublishProductInput,
  ProductSearchInput
} from '@neuronhire/shared';

// Helper: convert null JSON to Prisma.JsonNull
const toJsonValue = (v: Record<string, unknown> | null | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined => {
  if (v === null) return Prisma.JsonNull;
  if (v === undefined) return undefined;
  return v as Prisma.InputJsonValue;
};

export class ProductService {
  private prisma: PrismaClient;
  private moderationService: ProductModerationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.moderationService = new ProductModerationService();
  }

  /**
   * Create product listing
   */
  async createProduct(userId: string, data: CreateProductInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true }
    });

    if (!user || !user.engineerProfile) {
      throw new Error('Engineer profile not found');
    }

    if (user.role !== 'engineer') {
      throw new Error('Only engineers can create products');
    }

    // Generate slug from name
    const slug = this.generateSlug(data.name);

    // Check slug uniqueness
    const existing = await this.prisma.product.findUnique({
      where: { slug }
    });

    if (existing) {
      throw new Error('Product with this name already exists. Please choose a different name.');
    }

    // Validate screenshots minimum
    if (data.screenshots.length < 3) {
      throw new Error('Minimum 3 screenshots required');
    }

    // Create product in draft status
    const product = await this.prisma.product.create({
      data: {
        userId,
        engineerProfileId: user.engineerProfile.id,
        name: data.name,
        slug,
        tagline: data.tagline,
        category: data.category,
        tags: data.tags,
        thumbnailUrl: data.thumbnailUrl,
        description: data.description,
        demoUrl: data.demoUrl,
        screenshots: data.screenshots,
        techStack: data.techStack,
        aiModelUsed: data.aiModelUsed,
        architectureType: data.architectureType,
        pricingModel: data.pricingModel,
        priceINR: data.priceINR,
        priceUSD: data.priceUSD,
        features: data.features,
        performanceMetrics: toJsonValue(data.performanceMetrics),
        deliveryType: data.deliveryType,
        customizationAvailable: data.customizationAvailable,
        supportType: data.supportType,
        supportDuration: data.supportDuration,
        status: ProductStatus.draft,
        currentVersion: '1.0.0'
      }
    });

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, userId: string, data: UpdateProductInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // If product is published, create new version
    if (product.status === ProductStatus.published && this.isSignificantUpdate(data)) {
      return await this.createNewVersion(productId, userId, data);
    }

    // Update product
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        performanceMetrics: data.performanceMetrics !== undefined
          ? (data.performanceMetrics ? data.performanceMetrics as Prisma.InputJsonValue : Prisma.JsonNull)
          : undefined,
        updatedAt: new Date()
      }
    });

    return updated;
  }

  /**
   * Publish product (submit for moderation)
   */
  async publishProduct(productId: string, userId: string, _data: PublishProductInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.userId !== userId) {
      throw new Error('Unauthorized');
    }

    if (product.status !== ProductStatus.draft) {
      throw new Error('Only draft products can be published');
    }

    // Moderate content
    const moderation = await this.moderationService.moderateProduct({
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      tags: product.tags
    });

    if (!moderation.approved) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          status: ProductStatus.suspended,
          moderationStatus: 'rejected',
          moderationNotes: moderation.notes,
          moderatedAt: new Date()
        }
      });

      throw new Error(`Product rejected: ${moderation.notes}`);
    }

    // Approve and publish
    const published = await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.published,
        moderationStatus: 'approved',
        moderationNotes: moderation.notes,
        moderatedAt: new Date(),
        publishedAt: new Date()
      }
    });

    return published;
  }

  /**
   * Create new version of product
   */
  async createNewVersion(productId: string, userId: string, data: UpdateProductInput) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (product.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Parse current version
    const currentVersion = product.currentVersion;
    const newVersion = this.incrementVersion(currentVersion, data);

    // Store previous version in history
    const versionHistory = (product.versionHistory as any[]) || [];
    versionHistory.push({
      version: currentVersion,
      publishedAt: product.publishedAt,
      changes: data,
      availableUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // Update product with new version
    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...data,
        performanceMetrics: data.performanceMetrics !== undefined
          ? (data.performanceMetrics ? data.performanceMetrics as Prisma.InputJsonValue : Prisma.JsonNull)
          : undefined,
        currentVersion: newVersion,
        versionHistory,
        status: ProductStatus.pending_moderation,
        updatedAt: new Date()
      }
    });

    // Moderate new version
    const moderation = await this.moderationService.moderateUpdate({
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      tags: data.tags
    });

    if (!moderation.approved) {
      await this.prisma.product.update({
        where: { id: productId },
        data: {
          status: ProductStatus.suspended,
          moderationStatus: 'rejected',
          moderationNotes: moderation.notes,
          moderatedAt: new Date()
        }
      });

      throw new Error(`Version update rejected: ${moderation.notes}`);
    }

    // Approve new version
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: ProductStatus.published,
        moderationStatus: 'approved',
        moderationNotes: moderation.notes,
        moderatedAt: new Date()
      }
    });

    // Notify buyers of update
    await this.notifyBuyersOfUpdate(productId, newVersion);

    return updated;
  }

  /**
   * Get product feed with filters
   */
  async getProductFeed(filters: ProductSearchInput) {
    const where: any = {
      status: ProductStatus.published
    };

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.pricingModel) {
      where.pricingModel = filters.pricingModel;
    }

    if (filters.minPrice || filters.maxPrice) {
      where.priceINR = {};
      if (filters.minPrice) {
        where.priceINR.gte = filters.minPrice;
      }
      if (filters.maxPrice) {
        where.priceINR.lte = filters.maxPrice;
      }
    }

    if (filters.aiModel) {
      where.aiModelUsed = { contains: filters.aiModel, mode: 'insensitive' };
    }

    if (filters.industry) {
      // Filter by tags containing industry
      where.tags = { has: filters.industry };
    }

    if (filters.minRating) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.hasDemo !== undefined && filters.hasDemo) {
      where.demoUrl = { not: null };
    }

    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { tagline: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { tags: { has: filters.query } }
      ];
    }

    const cursorCondition = filters.cursor ? { id: filters.cursor } : undefined;

    const products = await this.prisma.product.findMany({
      where,
      take: filters.limit + 1,
      skip: filters.cursor ? 1 : 0,
      cursor: cursorCondition,
      orderBy: {
        [filters.sortBy]: filters.sortOrder
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true
          }
        },
        _count: {
          select: {
            purchases: true,
            reviews: true
          }
        }
      }
    });

    const hasMore = products.length > filters.limit;
    const items = hasMore ? products.slice(0, -1) : products;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }

  /**
   * Get product by ID or slug
   */
  async getProduct(identifier: string, _userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }]
      },
      include: {
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true,
            portfolioUrl: true
          }
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            purchases: true,
            reviews: true
          }
        }
      }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } }
    });

    // Track analytics
    await this.trackView(product.id);

    return product;
  }

  /**
   * Get engineer's products
   */
  async getEngineerProducts(engineerProfileId: string, limit = 100) {
    return await this.prisma.product.findMany({
      where: { engineerProfileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: {
            purchases: true,
            reviews: true
          }
        }
      }
    });
  }

  // Helper methods

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  private isSignificantUpdate(data: UpdateProductInput): boolean {
    // Check if update includes significant changes that warrant a new version
    return !!(
      data.name ||
      data.description ||
      data.features ||
      data.techStack ||
      data.priceINR ||
      data.priceUSD
    );
  }

  private incrementVersion(currentVersion: string, data: UpdateProductInput): string {
    const [major, minor, patch] = currentVersion.split('.').map(Number);

    // Major version: breaking changes (price increase > 20%, major feature changes)
    if (data.priceINR || data.priceUSD || data.features) {
      return `${major + 1}.0.0`;
    }

    // Minor version: new features
    if (data.techStack || data.performanceMetrics) {
      return `${major}.${minor + 1}.0`;
    }

    // Patch version: bug fixes, minor updates
    return `${major}.${minor}.${patch + 1}`;
  }

  private async notifyBuyersOfUpdate(productId: string, newVersion: string) {
    // Get all buyers
    const purchases = await this.prisma.purchase.findMany({
      where: {
        productId,
        status: 'completed',
        licenseActive: true
      },
      include: {
        buyer: {
          select: {
            email: true
          }
        }
      }
    });

    // TODO: Send email notifications to buyers
    console.log(`Notifying ${purchases.length} buyers of version ${newVersion}`);
  }

  private async trackView(productId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await this.prisma.productAnalytics.upsert({
      where: {
        productId_date: {
          productId,
          date: today
        }
      },
      create: {
        productId,
        date: today,
        views: 1
      },
      update: {
        views: { increment: 1 }
      }
    });
  }
}
