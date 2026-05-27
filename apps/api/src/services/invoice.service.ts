import { PrismaClient } from "@prisma/client";
import { getEnv } from "../config/env";
import { S3UploadService } from "./s3-upload.service";

export class InvoiceService {
  private prisma: PrismaClient;
  private clearTaxApiUrl = "https://api.cleartax.in/v2";
  private clearTaxApiKey: string;
  private s3Service: S3UploadService;

  constructor() {
    this.prisma = new PrismaClient();
    this.clearTaxApiKey = getEnv("CLEARTAX_API_KEY") ?? "";
    this.s3Service = new S3UploadService();
  }

  /**
   * Generate GST-compliant invoice for payment
   * Auto-triggered on payment completion
   */
  async generateInvoice(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          include: {
            engineerProfile: true,
            companyProfile: true,
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Check if invoice already exists
    const existing = await this.prisma.invoice.findUnique({
      where: { paymentId },
    });

    if (existing) {
      return existing;
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Prepare invoice data
    const invoiceData = {
      invoiceNumber,
      paymentId: payment.id,
      fromName: "NeuronHire Technologies Pvt Ltd",
      fromAddress: "Bangalore, Karnataka, India",
      fromGstin: getEnv("COMPANY_GSTIN"),
      toName:
        (payment.user as any).engineerProfile?.fullName ||
        (payment.user as any).companyProfile?.companyName ||
        "Customer",
      toAddress: this.getUserAddress(payment.user),
      toGstin: this.getUserGSTIN(payment.user),
      subtotal: parseFloat(payment.amount.toString()),
      gstRate: 18,
      gstAmount: parseFloat(payment.gstAmount?.toString() || "0"),
      total:
        parseFloat(payment.amount.toString()) +
        parseFloat(payment.gstAmount?.toString() || "0"),
      currency: payment.currency,
      lineItems: this.generateLineItems(payment),
      invoiceDate: new Date(),
      dueDate: null, // Immediate payment
    };

    // Create invoice in database
    const invoice = await this.prisma.invoice.create({
      data: invoiceData,
    });

    // Generate PDF via ClearTax API
    try {
      const pdfUrl = await this.generateInvoicePDF(invoice);

      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl },
      });

      // Send invoice via email
      await this.sendInvoiceEmail(invoice.id);

      return invoice;
    } catch (error: any) {
      console.error("Invoice PDF generation error:", error);
      // Invoice created but PDF generation failed
      return invoice;
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");

    // Get count of invoices this month
    const startOfMonth = new Date(year, new Date().getMonth(), 1);
    const count = await this.prisma.invoice.count({
      where: {
        invoiceDate: {
          gte: startOfMonth,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Generate line items for invoice
   */
  private generateLineItems(payment: any): any[] {
    const items: any[] = [];

    switch (payment.type) {
      case "escrow_deposit":
        items.push({
          description: "Escrow Deposit",
          quantity: 1,
          unitPrice: parseFloat(payment.amount.toString()),
          total: parseFloat(payment.amount.toString()),
        });
        break;

      case "milestone_release":
        items.push({
          description: "Milestone Payment",
          quantity: 1,
          unitPrice: parseFloat(payment.amount.toString()),
          total: parseFloat(payment.amount.toString()),
        });
        break;

      case "subscription":
        items.push({
          description: "Platform Subscription",
          quantity: 1,
          unitPrice: parseFloat(payment.amount.toString()),
          total: parseFloat(payment.amount.toString()),
        });
        break;

      case "platform_fee":
        items.push({
          description: "Platform Service Fee",
          quantity: 1,
          unitPrice: parseFloat(payment.platformFee?.toString() || "0"),
          total: parseFloat(payment.platformFee?.toString() || "0"),
        });
        break;

      default:
        items.push({
          description: payment.description || "Payment",
          quantity: 1,
          unitPrice: parseFloat(payment.amount.toString()),
          total: parseFloat(payment.amount.toString()),
        });
    }

    // Add GST line item
    if (payment.gstAmount && parseFloat(payment.gstAmount.toString()) > 0) {
      items.push({
        description: "GST @ 18%",
        quantity: 1,
        unitPrice: parseFloat(payment.gstAmount.toString()),
        total: parseFloat(payment.gstAmount.toString()),
      });
    }

    return items;
  }

  /**
   * Generate invoice PDF via ClearTax API
   */
  private async generateInvoicePDF(invoice: any): Promise<string> {
    try {
      // In production, integrate with ClearTax API
      // const response = await axios.post(
      //   `${this.clearTaxApiUrl}/invoice/generate`,
      //   {
      //     invoice_number: invoice.invoiceNumber,
      //     invoice_date: invoice.invoiceDate,
      //     seller: {
      //       name: invoice.fromName,
      //       address: invoice.fromAddress,
      //       gstin: invoice.fromGstin
      //     },
      //     buyer: {
      //       name: invoice.toName,
      //       address: invoice.toAddress,
      //       gstin: invoice.toGstin
      //     },
      //     line_items: invoice.lineItems,
      //     total: invoice.total,
      //     gst_amount: invoice.gstAmount
      //   },
      //   {
      //     headers: {
      //       'X-Cleartax-Auth-Token': this.clearTaxApiKey,
      //       'Content-Type': 'application/json'
      //     }
      //   }
      // );

      // For demo, generate a simple PDF URL
      const pdfUrl = `https://neuronhire-invoices.s3.amazonaws.com/${invoice.invoiceNumber}.pdf`;

      return pdfUrl;
    } catch (error: any) {
      console.error("ClearTax API error:", error);
      throw new Error("Failed to generate invoice PDF");
    }
  }

  /**
   * Send invoice via email
   */
  private async sendInvoiceEmail(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just mark as sent
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payment: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check authorization
    if (invoice.payment.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return invoice;
  }

  /**
   * Get invoice by payment ID
   */
  async getInvoiceByPayment(paymentId: string) {
    return await this.prisma.invoice.findUnique({
      where: { paymentId },
    });
  }

  /**
   * Get user's invoices
   */
  async getUserInvoices(userId: string, limit = 50, cursor?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        payment: {
          userId,
        },
        deletedAt: null, // Only non-deleted invoices
      },
      include: {
        payment: true,
      },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { invoiceDate: "desc" },
    });

    const hasMore = invoices.length > limit;
    const items = hasMore ? invoices.slice(0, -1) : invoices;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor, hasMore };
  }

  /**
   * Soft delete invoice (7-year retention policy)
   */
  async softDeleteInvoice(invoiceId: string) {
    return await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get user address for invoice
   */
  private getUserAddress(user: any): string {
    if (user.companyProfile) {
      return user.companyProfile.location || "India";
    }
    if (user.engineerProfile) {
      return user.engineerProfile.location || "India";
    }
    return "India";
  }

  /**
   * Get user GSTIN for invoice
   */
  private getUserGSTIN(user: any): string | null {
    if (user.companyProfile) {
      return user.companyProfile.gstin || null;
    }
    return null;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string, userId: string): Promise<string> {
    const invoice = await this.getInvoice(invoiceId, userId);

    if (!invoice.pdfUrl) {
      throw new Error("Invoice PDF not available");
    }

    return invoice.pdfUrl;
  }

  /**
   * Resend invoice email
   */
  async resendInvoiceEmail(invoiceId: string, userId: string) {
    const invoice = await this.getInvoice(invoiceId, userId);
    return await this.sendInvoiceEmail(invoice.id);
  }

  /**
   * Get invoices for financial year (for tax purposes)
   */
  async getFinancialYearInvoices(userId: string, financialYear: number) {
    const startDate = new Date(financialYear, 3, 1); // April 1st
    const endDate = new Date(financialYear + 1, 2, 31); // March 31st

    return await this.prisma.invoice.findMany({
      where: {
        payment: {
          userId,
        },
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      include: {
        payment: true,
      },
      orderBy: { invoiceDate: "asc" },
    });
  }

  /**
   * Get total GST paid by user in financial year
   */
  async getTotalGSTPaid(
    userId: string,
    financialYear: number,
  ): Promise<number> {
    const invoices = await this.getFinancialYearInvoices(userId, financialYear);

    return invoices.reduce((total, invoice) => {
      return total + parseFloat(invoice.gstAmount.toString());
    }, 0);
  }
}
