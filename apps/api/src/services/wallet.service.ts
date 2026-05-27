import { PrismaClient } from "@prisma/client";

export class WalletService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create wallet for user
   */
  async createWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing;
    }

    return await this.prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: "INR",
      },
    });
  }

  /**
   * Credit wallet (add funds)
   */
  async creditWallet(data: {
    userId: string;
    amount: number;
    description: string;
    paymentId?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      let wallet = await tx.wallet.findUnique({
        where: { userId: data.userId },
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: {
            userId: data.userId,
            balance: 0,
            currency: "INR",
          },
        });
      }

      const balanceBefore = parseFloat(wallet.balance.toString());
      const balanceAfter = balanceBefore + data.amount;

      // Update wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: data.userId },
        data: {
          balance: balanceAfter,
          totalEarned: {
            increment: data.amount,
          },
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "credit",
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          description: data.description,
          paymentId: data.paymentId,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Debit wallet (remove funds)
   */
  async debitWallet(data: {
    userId: string;
    amount: number;
    description: string;
    payoutId?: string;
  }) {
    return await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId: data.userId },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const balanceBefore = parseFloat(wallet.balance.toString());

      if (balanceBefore < data.amount) {
        throw new Error("Insufficient wallet balance");
      }

      const balanceAfter = balanceBefore - data.amount;

      // Update wallet
      const updatedWallet = await tx.wallet.update({
        where: { userId: data.userId },
        data: {
          balance: balanceAfter,
        },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "debit",
          amount: data.amount,
          balanceBefore,
          balanceAfter,
          description: data.description,
          payoutId: data.payoutId,
        },
      });

      return { wallet: updatedWallet, transaction };
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return 0;
    }

    return parseFloat(wallet.balance.toString());
  }

  /**
   * Get wallet details
   */
  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await this.createWallet(userId);
    }

    return wallet;
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(userId: string, limit = 50, cursor?: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    const hasMore = transactions.length > limit;
    const items = hasMore ? transactions.slice(0, -1) : transactions;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor, hasMore };
  }

  /**
   * Get monthly withdrawal amount
   */
  async getMonthlyWithdrawal(userId: string): Promise<number> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      return 0;
    }

    const currentMonth = new Date().toISOString().substring(0, 7);

    if (wallet.lastWithdrawalMonth !== currentMonth) {
      return 0;
    }

    return parseFloat(wallet.currentMonthWithdrawn.toString());
  }

  /**
   * Reset monthly withdrawal counter (run on 1st of each month)
   */
  async resetMonthlyWithdrawals() {
    const currentMonth = new Date().toISOString().substring(0, 7);

    await this.prisma.wallet.updateMany({
      where: {
        lastWithdrawalMonth: {
          not: currentMonth,
        },
      },
      data: {
        currentMonthWithdrawn: 0,
        lastWithdrawalMonth: currentMonth,
      },
    });

    return { success: true };
  }

  /**
   * Get wallet statistics
   */
  async getWalletStats(userId: string) {
    const wallet = await this.getWallet(userId);
    const monthlyWithdrawal = await this.getMonthlyWithdrawal(userId);

    return {
      balance: parseFloat(wallet.balance.toString()),
      totalEarned: parseFloat(wallet.totalEarned.toString()),
      totalWithdrawn: parseFloat(wallet.totalWithdrawn.toString()),
      monthlyWithdrawal,
      currency: wallet.currency,
    };
  }
}
