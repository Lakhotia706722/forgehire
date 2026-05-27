import PDFDocument from "pdfkit";
import { S3UploadService } from "./s3-upload.service";

export class ContractGeneratorService {
  private s3Service: S3UploadService;

  constructor() {
    this.s3Service = new S3UploadService();
  }

  /**
   * Generate pre-filled contract PDF
   */
  async generateContractPDF(contract: any): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(20).text("EMPLOYMENT/SERVICE CONTRACT", { align: "center" });
    doc.moveDown();

    // Contract details
    doc.fontSize(12).text(`Contract ID: ${contract.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Parties
    doc.fontSize(14).text("PARTIES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Company: ${contract.companyProfile.companyName}`);
    doc.text(`Engineer: ${contract.engineerProfile.fullName}`);
    doc.moveDown();

    // Contract type
    doc.fontSize(14).text("CONTRACT TYPE", { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(`Hiring Mode: ${this.formatHiringMode(contract.hiringMode)}`);
    doc.moveDown();

    // Scope of work
    doc.fontSize(14).text("SCOPE OF WORK", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(contract.scope, { align: "justify" });
    doc.moveDown();

    // Compensation
    doc.fontSize(14).text("COMPENSATION", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);

    if (contract.hiringMode === "full_time") {
      doc.text(
        `Annual CTC: ${contract.currency} ${contract.ctc?.toLocaleString()}`,
      );
      doc.text(
        `Placement Fee: ${contract.currency} ${contract.placementFee?.toLocaleString()}`,
      );
    } else if (contract.hiringMode === "internship") {
      doc.text(
        `Monthly Stipend: ${contract.currency} ${contract.stipendAmount?.toLocaleString()}`,
      );
      doc.text(`Duration: ${contract.durationMonths} months`);
    } else if (contract.hiringMode === "hourly_contract") {
      doc.text(
        `Hourly Rate: ${contract.currency} ${contract.hourlyRate?.toLocaleString()}`,
      );
      doc.text(`Estimated Hours: ${contract.estimatedHours}`);
    } else if (contract.hiringMode === "project_contract") {
      doc.text(
        `Total Amount: ${contract.currency} ${contract.totalAmount?.toLocaleString()}`,
      );
    }
    doc.moveDown();

    // Timeline
    doc.fontSize(14).text("TIMELINE", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(
      `Start Date: ${new Date(contract.startDate).toLocaleDateString()}`,
    );
    if (contract.endDate) {
      doc.text(`End Date: ${new Date(contract.endDate).toLocaleDateString()}`);
    }
    doc.moveDown();

    // IP Ownership
    doc.fontSize(14).text("INTELLECTUAL PROPERTY", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`IP Ownership: ${contract.ipOwnership.toUpperCase()}`);
    doc.text(
      "All work product, inventions, and intellectual property created during the term of this contract shall be owned by the party specified above.",
    );
    doc.moveDown();

    // Confidentiality
    if (contract.ndaRequired) {
      doc.fontSize(14).text("CONFIDENTIALITY", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(
        contract.confidentialityTerms ||
          "The Engineer agrees to maintain confidentiality of all proprietary information, trade secrets, and business information disclosed during the term of this contract.",
        { align: "justify" },
      );
      doc.moveDown();
    }

    // Milestones (for project contracts)
    if (contract.hiringMode === "project_contract" && contract.milestones) {
      doc.fontSize(14).text("MILESTONES", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);

      const milestones = contract.milestones as any[];
      milestones.forEach((milestone: any, index: number) => {
        doc.text(
          `${index + 1}. ${milestone.title} - ${contract.currency} ${milestone.amount.toLocaleString()}`,
        );
        doc.fontSize(10).text(`   ${milestone.description}`, { indent: 20 });
        doc.fontSize(11);
      });
      doc.moveDown();
    }

    // Signature blocks
    doc.addPage();
    doc.fontSize(14).text("SIGNATURES", { underline: true });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text("Company Representative:");
    doc.moveDown(2);
    doc.text("_________________________");
    doc.text("Signature");
    doc.moveDown(0.5);
    doc.text("Date: _____________");
    doc.moveDown(3);

    doc.text("Engineer:");
    doc.moveDown(2);
    doc.text("_________________________");
    doc.text("Signature");
    doc.moveDown(0.5);
    doc.text("Date: _____________");

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `contracts/${contract.id}/contract-draft.pdf`;
          const url = await this.s3Service.uploadBuffer(
            pdfBuffer,
            fileName,
            "application/pdf",
          );
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Generate signed contract PDF with signatures
   */
  async generateSignedContractPDF(contract: any): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    // Similar to generateContractPDF but with signature data
    doc.fontSize(20).text("EMPLOYMENT/SERVICE CONTRACT", { align: "center" });
    doc.fontSize(12).text("(FULLY EXECUTED)", { align: "center" });
    doc.moveDown();

    // ... (same content as generateContractPDF)
    doc.fontSize(12).text(`Contract ID: ${contract.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("PARTIES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Company: ${contract.companyProfile.companyName}`);
    doc.text(`Engineer: ${contract.engineerProfile.fullName}`);
    doc.moveDown();

    // Add all sections...
    doc.fontSize(14).text("SCOPE OF WORK", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(contract.scope, { align: "justify" });
    doc.moveDown();

    // Signature blocks with actual signatures
    doc.addPage();
    doc.fontSize(14).text("SIGNATURES", { underline: true });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text("Company Representative:");
    doc.moveDown(1);
    doc.text(`Signed: ${contract.companySignedAt?.toLocaleString()}`);
    doc.text(`IP Address: ${contract.companySignIp}`);
    doc.text(
      `Digital Signature: ${contract.companySignature?.substring(0, 50)}...`,
    );
    doc.moveDown(2);

    doc.text("Engineer:");
    doc.moveDown(1);
    doc.text(`Signed: ${contract.engineerSignedAt?.toLocaleString()}`);
    doc.text(`IP Address: ${contract.engineerSignIp}`);
    doc.text(
      `Digital Signature: ${contract.engineerSignature?.substring(0, 50)}...`,
    );

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `contracts/${contract.id}/contract-signed.pdf`;
          const url = await this.s3Service.uploadBuffer(
            pdfBuffer,
            fileName,
            "application/pdf",
          );
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Generate amendment PDF
   */
  async generateAmendmentPDF(
    contract: any,
    amendmentNumber: number,
    reason: string,
    changes: any,
  ): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(20).text("CONTRACT AMENDMENT", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Amendment Number: ${amendmentNumber}`);
    doc.text(`Original Contract ID: ${contract.id}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text("REASON FOR AMENDMENT", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(reason, { align: "justify" });
    doc.moveDown();

    doc.fontSize(14).text("CHANGES", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);

    Object.keys(changes).forEach((key) => {
      doc.text(`${key}: ${JSON.stringify(changes[key])}`);
    });
    doc.moveDown();

    // Signature blocks
    doc.addPage();
    doc.fontSize(14).text("SIGNATURES", { underline: true });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text("Both parties agree to the above amendments.");
    doc.moveDown(2);

    doc.text("Company Representative:");
    doc.moveDown(2);
    doc.text("_________________________");
    doc.moveDown(3);

    doc.text("Engineer:");
    doc.moveDown(2);
    doc.text("_________________________");

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `contracts/${contract.id}/amendment-${amendmentNumber}.pdf`;
          const url = await this.s3Service.uploadBuffer(
            pdfBuffer,
            fileName,
            "application/pdf",
          );
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Generate signed amendment PDF
   */
  async generateSignedAmendmentPDF(
    contract: any,
    amendment: any,
  ): Promise<string> {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(20).text("CONTRACT AMENDMENT", { align: "center" });
    doc.fontSize(12).text("(FULLY EXECUTED)", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Amendment Number: ${amendment.amendmentNumber}`);
    doc.text(`Original Contract ID: ${contract.id}`);
    doc.moveDown();

    doc.fontSize(14).text("SIGNATURES", { underline: true });
    doc.moveDown(2);

    doc.fontSize(11);
    doc.text("Company Representative:");
    doc.text(`Signed: ${amendment.companySignedAt?.toLocaleString()}`);
    doc.moveDown(2);

    doc.text("Engineer:");
    doc.text(`Signed: ${amendment.engineerSignedAt?.toLocaleString()}`);

    doc.end();

    return new Promise((resolve, reject) => {
      doc.on("end", async () => {
        try {
          const pdfBuffer = Buffer.concat(chunks);
          const fileName = `contracts/${contract.id}/amendment-${amendment.amendmentNumber}-signed.pdf`;
          const url = await this.s3Service.uploadBuffer(
            pdfBuffer,
            fileName,
            "application/pdf",
          );
          resolve(url);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private formatHiringMode(mode: string): string {
    const modes: Record<string, string> = {
      full_time: "Full-Time Employment",
      internship: "Internship",
      hourly_contract: "Hourly Contract",
      project_contract: "Project-Based Contract",
    };
    return modes[mode] || mode;
  }
}
