import { PrismaClient } from '@prisma/client';
import { RazorpayEscrowService } from './razorpay-escrow.service';

export class HourlyBillingService {
  private prisma: PrismaClient;
  private escrowService: RazorpayEscrowService;
  private platformFeePercentage = 0.10; // 10% platform fee

  constructor() {
    this.prisma = new PrismaClient();
    this.escrowService = new RazorpayEscrowService();
  }

  /**
   * Log hours for hourly contract
   */
  async logHours(data: {
    contractId: string;
    engineerProfileId: string;
    date: Date;
    hoursLogged: number;
    description: string;
  }) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: data.contractId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.hiringMode !== 'hourly_contract') {
      throw new Error('Contract is not an hourly contract');
    }

    if (contract.status !== 'active') {
      throw new Error('Contract is not active');
    }

    // Check if entry already exists for this date
    const existing = await this.prisma.timeEntry.findFirst({
      where: {
        contractId: data.contractId,
        engineerProfileId: data.engineerProfileId,
        date: data.date
      }
    });

    if (existing) {
      throw new Error('Time entry already exists for this date');
    }

    return await this.prisma.timeEntry.create({
      data: {
        contractId: data.contractId,
        engineerProfileId: data.engineerProfileId,
        date: data.date,
        hoursLogged: data.hoursLogged,
        description: data.description
      }
    });
  }

  /**
   * Approve time entry
   */
  async approveTimeEntry(timeEntryId: string, approvedBy: string) {
    const timeEntry = await this.prisma.timeEntry.findUnique({
      where: { id: timeEntryId },
      include: { contract: true }
    });

    if (!timeEntry) {
      throw new Error('Time entry not found');
    }

    if (timeEntry.contract.companyUserId !== approvedBy) {
      throw new Error('Only company can approve time entries');
    }

    if (timeEntry.approved) {
      throw new Error('Time entry already approved');
    }

    // Calculate billing amount
    const hourlyRate = parseFloat(timeEntry.contract.hourlyRate?.toString() || '0');
    const hours = parseFloat(timeEntry.hoursLogged.toString());
    const grossAmount = hourlyRate * hours;
    const platformFee = grossAmount * this.platformFeePercentage;
    const billingAmount = grossAmount - platformFee;

    return await this.prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        approved: true,
        approvedAt: new Date(),
        approvedBy,
        billingAmount
      }
    });
  }

  /**
   * Process weekly billing (runs every Friday)
   */
  async processWeeklyBilling() {
    // Get all active hourly contracts
    const contracts = await this.prisma.contract.findMany({
      where: {
        hiringMode: 'hourly_contract',
        status: 'active'
      },
      include: {
        engineerProfile: true,
        timeEntries: {
          where: {
            approved: true,
            billed: false
          }
        }
      }
    });

    const results = [];

    for (const contract of contracts) {
      if (contract.timeEntries.length === 0) {
        continue;
      }

      // Calculate total billing
      const totalBilling = contract.timeEntries.reduce((sum, entry) => {
        return sum + parseFloat(entry.billingAmount?.toString() || '0');
      }, 0);

      // Check wallet balance
      const walletBalance = parseFloat(contract.walletBalance?.toString() || '0');

      if (walletBalance < totalBilling) {
        // Insufficient funds - notify company
        results.push({
          contractId: contract.id,
          status: 'insufficient_funds',
          required: totalBilling,
          available: walletBalance
        });
        continue;
      }

      // Process payout
      try {
        if (!contract.engineerProfile.upiId) {
          throw new Error('Engineer UPI ID not configured');
        }

        const payout = await this.escrowService.releaseEscrow(
          contract.id,
          contract.engineerProfile.upiId,
          totalBilling,
          contract.currency
        );

        // Mark time entries as billed
        await this.prisma.timeEntry.updateMany({
          where: {
            id: { in: contract.timeEntries.map(e => e.id) }
          },
          data: {
            billed: true,
            billedAt: new Date()
          }
        });

        // Update wallet balance
        await this.prisma.contract.update({
          where: { id: contract.id },
          data: {
            walletBalance: walletBalance - totalBilling
          }
        });

        results.push({
          contractId: contract.id,
          status: 'success',
          amount: totalBilling,
          payoutId: payout.payoutId
        });
      } catch (error: any) {
        results.push({
          contractId: contract.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Fund company wallet for hourly contract
   */
  async fundWallet(contractId: string, amount: number, _paymentDetails: any) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.hiringMode !== 'hourly_contract') {
      throw new Error('Contract is not an hourly contract');
    }

    const currentBalance = parseFloat(contract.walletBalance?.toString() || '0');
    const newBalance = currentBalance + amount;

    return await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        walletBalance: newBalance
      }
    });
  }

  /**
   * Get time entries for contract
   */
  async getTimeEntries(contractId: string, filters?: {
    approved?: boolean;
    billed?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { contractId };

    if (filters?.approved !== undefined) {
      where.approved = filters.approved;
    }

    if (filters?.billed !== undefined) {
      where.billed = filters.billed;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    return await this.prisma.timeEntry.findMany({
      where,
      include: {
        engineerProfile: {
          select: {
            fullName: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Calculate billing amount (utility function for tests)
   */
  calculateBillingAmount(hours: number, rate: number): number {
    const grossAmount = hours * rate;
    const platformFee = grossAmount * this.platformFeePercentage;
    return grossAmount - platformFee;
  }
}
