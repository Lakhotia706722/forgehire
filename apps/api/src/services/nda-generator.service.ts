import PDFDocument from 'pdfkit';
import { S3UploadService } from './s3-upload.service';

export interface NDAData {
  taskId: string;
  taskTitle: string;
  companyName: string;
  engineerName: string;
  engineerEmail: string;
  date: Date;
}

export class NDAGeneratorService {
  private s3Service: S3UploadService;

  constructor() {
    this.s3Service = new S3UploadService();
  }

  /**
   * Generate NDA PDF for a task
   */
  async generateNDA(data: NDAData): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);

            // Upload to S3 using buffer directly
            const s3Url = await this.s3Service.uploadFile(
              pdfBuffer,
              `ndas/${data.taskId}/${data.engineerEmail}_${Date.now()}.pdf`,
              'application/pdf'
            );

            resolve(s3Url);
          } catch (error) {
            reject(error);
          }
        });

        // Generate NDA content
        this.generateNDAContent(doc, data);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate NDA content
   */
  private generateNDAContent(doc: PDFKit.PDFDocument, data: NDAData): void {
    const formattedDate = data.date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('NON-DISCLOSURE AGREEMENT', { align: 'center' })
      .moveDown(2);

    // Date
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Date: ${formattedDate}`, { align: 'right' })
      .moveDown(1.5);

    // Parties
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('BETWEEN:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Company: ${data.companyName}`, { indent: 20 })
      .text('(hereinafter referred to as "Disclosing Party")', { indent: 20 })
      .moveDown(0.5)
      .text('AND', { align: 'center' })
      .moveDown(0.5)
      .text(`Engineer: ${data.engineerName}`, { indent: 20 })
      .text(`Email: ${data.engineerEmail}`, { indent: 20 })
      .text('(hereinafter referred to as "Receiving Party")', { indent: 20 })
      .moveDown(1.5);

    // Task reference
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('REGARDING:', { underline: true })
      .moveDown(0.5);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Task: ${data.taskTitle}`, { indent: 20 })
      .text(`Task ID: ${data.taskId}`, { indent: 20 })
      .moveDown(1.5);

    // Terms
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('TERMS AND CONDITIONS:', { underline: true })
      .moveDown(0.5);

    const terms = [
      {
        title: '1. Definition of Confidential Information',
        content: 'Confidential Information includes all information disclosed by the Disclosing Party to the Receiving Party, whether orally, in writing, or in any other form, including but not limited to: technical data, trade secrets, business plans, customer information, financial information, product specifications, source code, algorithms, and any other proprietary information related to the task.'
      },
      {
        title: '2. Obligations of Receiving Party',
        content: 'The Receiving Party agrees to: (a) maintain the confidentiality of all Confidential Information; (b) not disclose Confidential Information to any third party without prior written consent; (c) use Confidential Information solely for the purpose of completing the assigned task; (d) protect Confidential Information with the same degree of care used to protect their own confidential information, but not less than reasonable care.'
      },
      {
        title: '3. Exclusions',
        content: 'This Agreement does not apply to information that: (a) is or becomes publicly available through no breach of this Agreement; (b) was rightfully in the possession of the Receiving Party prior to disclosure; (c) is independently developed by the Receiving Party without use of Confidential Information; (d) is rightfully obtained from a third party without breach of confidentiality obligations.'
      },
      {
        title: '4. Term',
        content: 'This Agreement shall remain in effect for a period of 2 years from the date of signing, or until the Confidential Information no longer qualifies as confidential, whichever is later.'
      },
      {
        title: '5. Return of Materials',
        content: 'Upon completion of the task or upon request by the Disclosing Party, the Receiving Party shall promptly return or destroy all Confidential Information and certify such destruction in writing.'
      },
      {
        title: '6. No License',
        content: 'Nothing in this Agreement grants any license or right to the Receiving Party under any patent, copyright, trade secret, or other intellectual property right.'
      },
      {
        title: '7. Remedies',
        content: 'The Receiving Party acknowledges that breach of this Agreement may cause irreparable harm to the Disclosing Party, and that monetary damages may be inadequate. The Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.'
      },
      {
        title: '8. Governing Law',
        content: 'This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising under this Agreement shall be subject to the exclusive jurisdiction of courts in India.'
      }
    ];

    doc.fontSize(11).font('Helvetica');

    terms.forEach((term, index) => {
      if (index > 0 && doc.y > 650) {
        doc.addPage();
      }

      doc
        .font('Helvetica-Bold')
        .text(term.title, { indent: 20 })
        .moveDown(0.3);

      doc
        .font('Helvetica')
        .text(term.content, { indent: 40, align: 'justify' })
        .moveDown(0.8);
    });

    // Signature section
    if (doc.y > 600) {
      doc.addPage();
    }

    doc.moveDown(2);
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('SIGNATURES:', { underline: true })
      .moveDown(1.5);

    doc.fontSize(12).font('Helvetica');

    // Disclosing Party
    doc
      .text('Disclosing Party:', { indent: 20 })
      .moveDown(0.5)
      .text(`Company: ${data.companyName}`, { indent: 40 })
      .moveDown(2)
      .text('Signature: _______________________', { indent: 40 })
      .moveDown(0.5)
      .text('Date: _______________________', { indent: 40 })
      .moveDown(2);

    // Receiving Party
    doc
      .text('Receiving Party:', { indent: 20 })
      .moveDown(0.5)
      .text(`Name: ${data.engineerName}`, { indent: 40 })
      .text(`Email: ${data.engineerEmail}`, { indent: 40 })
      .moveDown(2)
      .text('Digital Signature: _______________________', { indent: 40 })
      .moveDown(0.5)
      .text('Date: _______________________', { indent: 40 })
      .text('IP Address: _______________________', { indent: 40 })
      .moveDown(2);

    // Footer
    doc
      .fontSize(10)
      .font('Helvetica-Oblique')
      .text('This is a legally binding agreement. By signing, you acknowledge that you have read, understood, and agree to be bound by the terms and conditions of this Non-Disclosure Agreement.', {
        align: 'center',
        indent: 20
      })
      .moveDown(1)
      .text('Generated via NeuronHire Platform', { align: 'center' })
      .text(`Task ID: ${data.taskId}`, { align: 'center' });
  }

  /**
   * Generate signed NDA with signature data
   */
  async generateSignedNDA(
    originalNdaUrl: string,
    signatureData: string,
    ipAddress: string,
    data: NDAData
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);

            // Upload to S3 using buffer directly
            const s3Url = await this.s3Service.uploadFile(
              pdfBuffer,
              `ndas/${data.taskId}/${data.engineerEmail}_signed_${Date.now()}.pdf`,
              'application/pdf'
            );

            resolve(s3Url);
          } catch (error) {
            reject(error);
          }
        });

        // Generate signed NDA content
        this.generateNDAContent(doc, data);

        // Add signature page
        doc.addPage();
        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('DIGITAL SIGNATURE VERIFICATION', { align: 'center' })
          .moveDown(2);

        doc.fontSize(12).font('Helvetica');
        doc
          .text(`Signed by: ${data.engineerName}`, { indent: 20 })
          .text(`Email: ${data.engineerEmail}`, { indent: 20 })
          .text(`Date: ${new Date().toLocaleString('en-IN')}`, { indent: 20 })
          .text(`IP Address: ${ipAddress}`, { indent: 20 })
          .moveDown(2)
          .text('Digital Signature:', { indent: 20 })
          .fontSize(10)
          .font('Courier')
          .text(signatureData.substring(0, 100) + '...', { indent: 40 })
          .moveDown(2);

        doc
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text('This document has been digitally signed and is legally binding.', {
            align: 'center'
          })
          .text('Signature verified by NeuronHire Platform', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
