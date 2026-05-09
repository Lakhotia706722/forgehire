import { PrismaClient, KYCStatus } from '@prisma/client';
import { getEnv } from '../config/env';

export class KYCService {
  private prisma: PrismaClient;
  private digioApiUrl = 'https://api.digio.in/v2';
  private digioApiKey: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.digioApiKey = getEnv('DIGIO_API_KEY') ?? '';
  }

  /**
   * Initiate KYC verification
   */
  async initiateKYC(userId: string, engineerProfileId: string) {
    // Check if KYC already exists
    let kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    if (kyc && kyc.status === 'verified') {
      throw new Error('KYC already verified');
    }

    if (!kyc) {
      kyc = await this.prisma.kYCVerification.create({
        data: {
          userId,
          engineerProfileId,
          status: KYCStatus.pending
        }
      });
    }

    return kyc;
  }

  /**
   * Submit Aadhaar for verification
   */
  async submitAadhaar(userId: string, aadhaarNumber: string, documentUrl: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    if (!kyc) {
      throw new Error('KYC not initiated');
    }

    // Validate Aadhaar format (12 digits)
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      throw new Error('Invalid Aadhaar number format');
    }

    // In production, integrate with Digio API for verification
    // For now, we'll mark as pending verification
    await this.prisma.kYCVerification.update({
      where: { userId },
      data: {
        aadhaarNumber,
        aadhaarDocUrl: documentUrl,
        status: KYCStatus.pending
      }
    });

    // Trigger Digio verification
    await this.verifyAadhaarWithDigio(userId, aadhaarNumber);

    return { success: true, message: 'Aadhaar submitted for verification' };
  }

  /**
   * Submit PAN for verification
   */
  async submitPAN(userId: string, panNumber: string, documentUrl: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    if (!kyc) {
      throw new Error('KYC not initiated');
    }

    // Validate PAN format (ABCDE1234F)
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      throw new Error('Invalid PAN number format');
    }

    await this.prisma.kYCVerification.update({
      where: { userId },
      data: {
        panNumber,
        panDocUrl: documentUrl,
        status: KYCStatus.pending
      }
    });

    // Trigger Digio verification
    await this.verifyPANWithDigio(userId, panNumber);

    return { success: true, message: 'PAN submitted for verification' };
  }

  /**
   * Verify Aadhaar with Digio API
   */
  private async verifyAadhaarWithDigio(userId: string, _aadhaarNumber: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
      // In production, call Digio API
      // const response = await axios.post(
      //   `${this.digioApiUrl}/client/kyc/aadhaar`,
      //   { aadhaar_number: aadhaarNumber },
      //   {
      //     headers: {
      //       'Authorization': `Basic ${Buffer.from(this.digioApiKey + ':').toString('base64')}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // For demo, auto-verify after 5 seconds
      setTimeout(async () => {
        await this.prisma.kYCVerification.update({
          where: { userId },
          data: {
            aadhaarVerified: true,
            digioRequestId: `DIGIO_${Date.now()}`,
            digioStatus: 'verified'
          }
        });

        // Check if both documents verified
        await this.checkFullVerification(userId);
      }, 5000);

      return { success: true };
    } catch (error: any) {
      console.error('Digio Aadhaar verification error:', error);
      throw new Error('Aadhaar verification failed');
    }
  }

  /**
   * Verify PAN with Digio API
   */
  private async verifyPANWithDigio(userId: string, _panNumber: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
      // In production, call Digio API
      // const response = await axios.post(
      //   `${this.digioApiUrl}/client/kyc/pan`,
      //   { pan_number: panNumber },
      //   {
      //     headers: {
      //       'Authorization': `Basic ${Buffer.from(this.digioApiKey + ':').toString('base64')}`,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // For demo, auto-verify after 5 seconds
      setTimeout(async () => {
        await this.prisma.kYCVerification.update({
          where: { userId },
          data: {
            panVerified: true
          }
        });

        // Check if both documents verified
        await this.checkFullVerification(userId);
      }, 5000);

      return { success: true };
    } catch (error: any) {
      console.error('Digio PAN verification error:', error);
      throw new Error('PAN verification failed');
    }
  }

  /**
   * Check if full KYC is verified
   */
  private async checkFullVerification(userId: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    if (!kyc) return;

    if (kyc.aadhaarVerified && kyc.panVerified) {
      await this.prisma.kYCVerification.update({
        where: { userId },
        data: {
          status: KYCStatus.verified,
          verifiedAt: new Date()
        }
      });
    }
  }

  /**
   * Get KYC status
   */
  async getKYCStatus(userId: string) {
    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    if (!kyc) {
      return {
        status: KYCStatus.not_started,
        aadhaarVerified: false,
        panVerified: false
      };
    }

    return {
      status: kyc.status,
      aadhaarVerified: kyc.aadhaarVerified,
      panVerified: kyc.panVerified,
      verifiedAt: kyc.verifiedAt,
      rejectedAt: kyc.rejectedAt,
      rejectionReason: kyc.rejectionReason
    };
  }

  /**
   * Check if user can withdraw (KYC verified)
   */
  async canWithdraw(userId: string, amount: number): Promise<boolean> {
    const kycThreshold = 50000; // ₹50,000/month

    if (amount <= kycThreshold) {
      return true; // No KYC required for small amounts
    }

    const kyc = await this.prisma.kYCVerification.findUnique({
      where: { userId }
    });

    return kyc?.status === KYCStatus.verified;
  }

  /**
   * Reject KYC
   */
  async rejectKYC(userId: string, reason: string, rejectedBy: string) {
    return await this.prisma.kYCVerification.update({
      where: { userId },
      data: {
        status: KYCStatus.rejected,
        rejectedAt: new Date(),
        rejectionReason: reason,
        verifiedBy: rejectedBy
      }
    });
  }

  /**
   * Manually verify KYC (admin only)
   */
  async manuallyVerifyKYC(userId: string, verifiedBy: string) {
    return await this.prisma.kYCVerification.update({
      where: { userId },
      data: {
        status: KYCStatus.verified,
        aadhaarVerified: true,
        panVerified: true,
        verifiedAt: new Date(),
        verifiedBy
      }
    });
  }
}
