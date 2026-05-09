import { PrismaClient } from '@prisma/client';
import { CreateBundleInput, UpdateBundleInput } from '@neuronhire/shared';

export class BundleService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create bundle
   */
  async createBundle(userId: string, data: CreateBundleInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true }
    });

    if (!user || !user.engineerProfile) {
      throw new Error('Engineer profile not found');
    }

    if (user.role !== 'engineer') {
      throw new Error('Only engineers can create bundles');
    }

    // Validate products belong to engineer
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: data.productIds },
        userId
      }
    });

    if (products.length !== data.productIds.length) {
      throw new Error('Some products not found or do not belong to you');
    }

    // Calculate original price
    const originalPrice = products.reduce((sum, p) => {
      return sum + Number(p.priceINR || 0);
    }, 0);

    // Validate bundle price
    if (data.bundlePrice >= originalPrice) {
      throw new Error('Bundle price must be less than original price');
    }

    // Calculate discount percentage
    const discountPercent = ((originalPrice - data.bundlePrice) / originalPrice) * 100;

    // Create bundle
    const bundle = await this.prisma.bundle.create({
      data: {
        userId,
        engineerProfileId: user.engineerProfile.id,
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        originalPrice,
        bundlePrice: data.bundlePrice,
        discountPercent,
        currency: data.currency,
        active: true
      }
    });

    // Add products to bundle
    await Promise.all(
      data.productIds.map((productId, index) =>
        this.prisma.bundleProduct.create({
          data: {
            bundleId: bundle.id,
            productId,
            displayOrder: index
          }
        })
      )
    );

    return await this.getBundle(bundle.id);
  }

  /**
   * Update bundle
   */
  async updateBundle(bundleId: string, userId: string, data: UpdateBundleInput) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) {
      throw new Error('Bundle not found');
    }

    if (bundle.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // If updating products, recalculate prices
    if (data.productIds) {
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: data.productIds },
          userId
        }
      });

      if (products.length !== data.productIds.length) {
        throw new Error('Some products not found or do not belong to you');
      }

      const originalPrice = products.reduce((sum, p) => {
        return sum + Number(p.priceINR || 0);
      }, 0);

      const bundlePrice = data.bundlePrice || bundle.bundlePrice;
      const discountPercent = ((originalPrice - Number(bundlePrice)) / originalPrice) * 100;

      // Delete existing bundle products
      await this.prisma.bundleProduct.deleteMany({
        where: { bundleId }
      });

      // Add new products
      await Promise.all(
        data.productIds.map((productId, index) =>
          this.prisma.bundleProduct.create({
            data: {
              bundleId,
              productId,
              displayOrder: index
            }
          })
        )
      );

      // Update bundle
      return await this.prisma.bundle.update({
        where: { id: bundleId },
        data: {
          name: data.name,
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
          originalPrice,
          bundlePrice,
          discountPercent,
          active: data.active
        }
      });
    }

    // Update bundle without changing products
    return await this.prisma.bundle.update({
      where: { id: bundleId },
      data: {
        name: data.name,
        description: data.description,
        thumbnailUrl: data.thumbnailUrl,
        bundlePrice: data.bundlePrice,
        active: data.active
      }
    });
  }

  /**
   * Get bundle by ID
   */
  async getBundle(bundleId: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnailUrl: true,
                category: true,
                priceINR: true,
                rating: true,
                reviewCount: true
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        },
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true,
            neuronTier: true
          }
        }
      }
    });

    if (!bundle) {
      throw new Error('Bundle not found');
    }

    return bundle;
  }

  /**
   * Get engineer's bundles
   */
  async getEngineerBundles(engineerProfileId: string, limit = 50) {
    return await this.prisma.bundle.findMany({
      where: { engineerProfileId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                thumbnailUrl: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Get active bundles
   */
  async getActiveBundles(limit = 50) {
    return await this.prisma.bundle.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnailUrl: true,
                category: true,
                priceINR: true,
                rating: true
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        },
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true
          }
        }
      }
    });
  }

  /**
   * Delete bundle
   */
  async deleteBundle(bundleId: string, userId: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) {
      throw new Error('Bundle not found');
    }

    if (bundle.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // Delete bundle products first
    await this.prisma.bundleProduct.deleteMany({
      where: { bundleId }
    });

    // Delete bundle
    await this.prisma.bundle.delete({
      where: { id: bundleId }
    });

    return { success: true };
  }

  /**
   * Toggle bundle active status
   */
  async toggleBundleStatus(bundleId: string, userId: string) {
    const bundle = await this.prisma.bundle.findUnique({
      where: { id: bundleId }
    });

    if (!bundle) {
      throw new Error('Bundle not found');
    }

    if (bundle.userId !== userId) {
      throw new Error('Unauthorized');
    }

    return await this.prisma.bundle.update({
      where: { id: bundleId },
      data: {
        active: !bundle.active
      }
    });
  }
}
