import { PrismaClient, HiringMode, ContractStatus } from '@prisma/client';
import { ContractGeneratorService } from './contract-generator.service';
import { RazorpayEscrowService } from './razorpay-escrow.service';

export class ContractService {
  private prisma: PrismaClient;
  private contractGenerator: ContractGeneratorService;
  private escrowService: RazorpayEscrowService;

  constructor() {
    this.prisma = new PrismaClient();
    this.contractGenerator = new ContractGeneratorService();
    this.escrowService = new RazorpayEscrowService();
  }

  /**
   * Create a new contract
   */
  async createContract(data: {
    jobPostingId?: string;
    companyProfileId: string;
    engineerProfileId: string;
    companyUserId: string;
    engineerUserId: string;
    hiringMode: HiringMode;
    title: string;
    scope: string;
    startDate: Date;
    endDate?: Date;
    rate: number;
    currency?: string;
    ctc?: number;
    stipendAmount?: number;
    durationMonths?: number;
    hourlyRate?: number;
    estimatedHours?: number;
    totalAmount?: number;
    milestones?: any[];
    ipOwnership?: string;
    ndaRequired?: boolean;
    confidentialityTerms?: string;
    trialMode?: boolean;
  }) {
    // Calculate placement fee for full-time hires
    let placementFee: number | undefined;
    if (data.hiringMode === 'full_time' && data.ctc) {
      const feePercentage = data.ctc < 1000000 ? 0.08 : 0.12; // 8% for <10L, 12% for >=10L
      placementFee = data.ctc * feePercentage;
    }

    const contract = await this.prisma.contract.create({
      data: {
        jobPostingId: data.jobPostingId,
        companyProfileId: data.companyProfileId,
        engineerProfileId: data.engineerProfileId,
        companyUserId: data.companyUserId,
        engineerUserId: data.engineerUserId,
        hiringMode: data.hiringMode,
        title: data.title,
        scope: data.scope,
        startDate: data.startDate,
        endDate: data.endDate,
        rate: data.rate,
        currency: data.currency || 'INR',
        ctc: data.ctc,
        placementFee,
        stipendAmount: data.stipendAmount,
        durationMonths: data.durationMonths,
        hourlyRate: data.hourlyRate,
        estimatedHours: data.estimatedHours,
        totalAmount: data.totalAmount,
        milestones: data.milestones || undefined,
        ipOwnership: data.ipOwnership || 'company',
        ndaRequired: data.ndaRequired ?? true,
        confidentialityTerms: data.confidentialityTerms,
        trialMode: data.trialMode || false,
        status: ContractStatus.draft
      },
      include: {
        companyProfile: true,
        engineerProfile: true,
        companyUser: true,
        engineerUser: true
      }
    });

    // Generate pre-filled contract PDF
    const contractPdfUrl = await this.contractGenerator.generateContractPDF(contract);

    await this.prisma.contract.update({
      where: { id: contract.id },
      data: { contractPdfUrl }
    });

    return { ...contract, contractPdfUrl };
  }

  /**
   * Sign contract (company or engineer)
   */
  async signContract(
    contractId: string,
    userId: string,
    signature: string,
    ipAddress: string
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        companyProfile: true,
        engineerProfile: true
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    const isCompany = contract.companyUserId === userId;
    const isEngineer = contract.engineerUserId === userId;

    if (!isCompany && !isEngineer) {
      throw new Error('Unauthorized to sign this contract');
    }

    const updateData: any = {};

    if (isCompany) {
      if (contract.companySigned) {
        throw new Error('Company has already signed this contract');
      }
      updateData.companySigned = true;
      updateData.companySignature = signature;
      updateData.companySignedAt = new Date();
      updateData.companySignIp = ipAddress;
    }

    if (isEngineer) {
      if (contract.engineerSigned) {
        throw new Error('Engineer has already signed this contract');
      }
      updateData.engineerSigned = true;
      updateData.engineerSignature = signature;
      updateData.engineerSignedAt = new Date();
      updateData.engineerSignIp = ipAddress;
    }

    const updatedContract = await this.prisma.contract.update({
      where: { id: contractId },
      data: updateData,
      include: {
        companyProfile: true,
        engineerProfile: true,
        companyUser: true,
        engineerUser: true
      }
    });

    // If both parties have signed, activate the contract
    if (updatedContract.companySigned && updatedContract.engineerSigned) {
      await this.activateContract(contractId);
    }

    return updatedContract;
  }

  /**
   * Activate contract after both parties sign
   */
  private async activateContract(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        companyProfile: true,
        engineerProfile: true,
        companyUser: true,
        engineerUser: true
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Generate final signed contract PDF
    const finalContractUrl = await this.contractGenerator.generateSignedContractPDF(contract);

    // Create escrow for non-full-time contracts
    let walletBalance: number | undefined;
    if (contract.hiringMode === 'hourly_contract') {
      // For hourly contracts, company needs to pre-fund wallet
      walletBalance = 0;
    }

    // Create milestones for project contracts
    if (contract.hiringMode === 'project_contract' && contract.milestones) {
      const milestones = contract.milestones as any[];
      for (let i = 0; i < milestones.length; i++) {
        const milestone = milestones[i];
        await this.prisma.milestonePayment.create({
          data: {
            contractId: contract.id,
            milestoneNumber: i + 1,
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            dueDate: milestone.dueDate ? new Date(milestone.dueDate) : undefined,
            deliverables: milestone.deliverables || undefined,
            status: 'pending'
          }
        });
      }
    }

    // Update contract status
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.active,
        finalContractUrl,
        activatedAt: new Date(),
        walletBalance
      }
    });

    // Create project chat room
    await this.createProjectChatRoom(contractId);

    return { success: true, finalContractUrl };
  }

  /**
   * Create project chat room for contract
   */
  private async createProjectChatRoom(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    const room = await this.prisma.projectChatRoom.create({
      data: {
        contractId,
        name: `${contract.title} - Project Room`
      }
    });

    // Add company and engineer as participants
    await this.prisma.projectChatParticipant.createMany({
      data: [
        {
          roomId: room.id,
          userId: contract.companyUserId,
          role: 'company_admin'
        },
        {
          roomId: room.id,
          userId: contract.engineerUserId,
          role: 'engineer'
        }
      ]
    });

    return room;
  }

  /**
   * Create contract amendment
   */
  async createAmendment(
    contractId: string,
    userId: string,
    data: {
      reason: string;
      changes: any;
    }
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (contract.companyUserId !== userId && contract.engineerUserId !== userId) {
      throw new Error('Unauthorized');
    }

    if (contract.status !== ContractStatus.active) {
      throw new Error('Can only amend active contracts');
    }

    const amendmentNumber = contract.amendmentCount + 1;

    // Generate amendment PDF
    const amendmentPdfUrl = await this.contractGenerator.generateAmendmentPDF(
      contract,
      amendmentNumber,
      data.reason,
      data.changes
    );

    const amendment = await this.prisma.contractAmendment.create({
      data: {
        contractId,
        amendmentNumber,
        reason: data.reason,
        changes: data.changes,
        amendmentPdfUrl
      }
    });

    // Update contract status
    await this.prisma.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatus.amended,
        amendmentCount: amendmentNumber,
        lastAmendedAt: new Date()
      }
    });

    return amendment;
  }

  /**
   * Sign amendment
   */
  async signAmendment(amendmentId: string, userId: string) {
    const amendment = await this.prisma.contractAmendment.findUnique({
      where: { id: amendmentId },
      include: { contract: true }
    });

    if (!amendment) {
      throw new Error('Amendment not found');
    }

    const isCompany = amendment.contract.companyUserId === userId;
    const isEngineer = amendment.contract.engineerUserId === userId;

    if (!isCompany && !isEngineer) {
      throw new Error('Unauthorized');
    }

    const updateData: any = {};

    if (isCompany) {
      updateData.companySigned = true;
      updateData.companySignedAt = new Date();
    }

    if (isEngineer) {
      updateData.engineerSigned = true;
      updateData.engineerSignedAt = new Date();
    }

    const updatedAmendment = await this.prisma.contractAmendment.update({
      where: { id: amendmentId },
      data: updateData
    });

    // If both signed, generate final amendment PDF and reactivate contract
    if (updatedAmendment.companySigned && updatedAmendment.engineerSigned) {
      const finalPdfUrl = await this.contractGenerator.generateSignedAmendmentPDF(
        amendment.contract,
        updatedAmendment
      );

      await this.prisma.contractAmendment.update({
        where: { id: amendmentId },
        data: { finalPdfUrl }
      });

      await this.prisma.contract.update({
        where: { id: amendment.contractId },
        data: { status: ContractStatus.active }
      });
    }

    return updatedAmendment;
  }

  /**
   * Complete trial engagement
   */
  async completeTrial(contractId: string, userId: string, extend: boolean) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    if (!contract.trialMode) {
      throw new Error('Contract is not in trial mode');
    }

    if (contract.companyUserId !== userId && contract.engineerUserId !== userId) {
      throw new Error('Unauthorized');
    }

    if (extend) {
      return await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          trialCompleted: true,
          trialExtended: true
        }
      });
    } else {
      // Decline - terminate contract
      return await this.prisma.contract.update({
        where: { id: contractId },
        data: {
          trialCompleted: true,
          status: ContractStatus.terminated,
          terminatedAt: new Date(),
          terminationReason: 'Trial not extended'
        }
      });
    }
  }

  /**
   * Get contract details
   */
  async getContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        companyProfile: true,
        engineerProfile: true,
        companyUser: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        engineerUser: {
          select: {
            id: true,
            email: true,
            role: true
          }
        },
        milestonePayments: true,
        amendments: true,
        timeEntries: {
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    });

    if (!contract) {
      throw new Error('Contract not found');
    }

    // Check authorization
    if (
      contract.companyUserId !== userId &&
      contract.engineerUserId !== userId
    ) {
      throw new Error('Unauthorized');
    }

    return contract;
  }

  /**
   * Get user's contracts
   */
  async getUserContracts(userId: string, filters?: {
    hiringMode?: HiringMode;
    status?: ContractStatus;
    role?: 'company' | 'engineer';
  }) {
    const where: any = {};

    if (filters?.role === 'company') {
      where.companyUserId = userId;
    } else if (filters?.role === 'engineer') {
      where.engineerUserId = userId;
    } else {
      where.OR = [
        { companyUserId: userId },
        { engineerUserId: userId }
      ];
    }

    if (filters?.hiringMode) {
      where.hiringMode = filters.hiringMode;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return await this.prisma.contract.findMany({
      where,
      include: {
        companyProfile: {
          select: {
            companyName: true,
            logoUrl: true
          }
        },
        engineerProfile: {
          select: {
            fullName: true,
            neuronScore: true
          }
        },
        _count: {
          select: {
            milestonePayments: true,
            timeEntries: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
