import Anthropic from '@anthropic-ai/sdk';
import { getEnv } from '../config/env';
import { S3UploadService } from './s3-upload.service';
import PDFDocument from 'pdfkit';

export interface AssessmentReport {
  overallScore: number;
  tier: string;
  dimensionScores: {
    modelKnowledge: number;
    engineeringDepth: number;
    systemDesign: number;
    codingQuality: number;
    practicalApp: number;
    communication: number;
  };
  skillGapAnalysis: string[];
  improvementRoadmap: Array<{
    area: string;
    priority: 'high' | 'medium' | 'low';
    recommendations: string[];
  }>;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
}

export class ReportGeneratorService {
  private anthropic: Anthropic;
  private s3Service: S3UploadService;

  constructor() {
    const env = getEnv();
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY
    });
    this.s3Service = new S3UploadService();
  }

  /**
   * Generate comprehensive assessment report using Claude API
   */
  async generateReport(
    assessmentData: any,
    engineerProfile: any
  ): Promise<AssessmentReport> {
    const prompt = `You are an AI assessment evaluator. Generate a comprehensive assessment report for an AI/ML engineer.

Engineer Profile:
- Name: ${engineerProfile.fullName}
- Experience: ${engineerProfile.yearsOfExperience} years
- Skills: ${engineerProfile.skills.map((s: any) => s.skillName).join(', ')}

Assessment Results:
- MCQ Score: ${assessmentData.mcqScore}/100
- Coding Score: ${assessmentData.codingScore}/100
- Case Study Score: ${assessmentData.caseScore}/100
- Total Score: ${assessmentData.totalScore}/100

Dimension Scores:
- Model Knowledge: ${assessmentData.modelKnowledge}/100
- Engineering Depth: ${assessmentData.engineeringDepth}/100
- System Design: ${assessmentData.systemDesign}/100
- Coding Quality: ${assessmentData.codingQuality}/100
- Practical Application: ${assessmentData.practicalApp}/100
- Communication: ${assessmentData.communication}/100

Generate a detailed report with:
1. Skill gap analysis (3-5 specific gaps)
2. Improvement roadmap (3-5 areas with priorities and recommendations)
3. Key strengths (3-5 points)
4. Areas for improvement (3-5 points)
5. Next steps (3-5 actionable items)

Return as JSON:
{
  "skillGapAnalysis": ["gap1", "gap2", ...],
  "improvementRoadmap": [
    {
      "area": "Area name",
      "priority": "high|medium|low",
      "recommendations": ["rec1", "rec2", ...]
    }
  ],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "nextSteps": ["step1", "step2", ...]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          
          return {
            overallScore: assessmentData.totalScore,
            tier: this.determineTier(assessmentData.totalScore),
            dimensionScores: {
              modelKnowledge: assessmentData.modelKnowledge,
              engineeringDepth: assessmentData.engineeringDepth,
              systemDesign: assessmentData.systemDesign,
              codingQuality: assessmentData.codingQuality,
              practicalApp: assessmentData.practicalApp,
              communication: assessmentData.communication
            },
            ...analysis
          };
        }
      }

      return this.getFallbackReport(assessmentData);
    } catch (error) {
      console.error('Report generation error:', error);
      return this.getFallbackReport(assessmentData);
    }
  }

  /**
   * Generate PDF report and upload to S3
   */
  async generatePDFReport(
    report: AssessmentReport,
    engineerProfile: any
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', async () => {
          const pdfBuffer = Buffer.concat(chunks);
          
          // Upload to S3
          const url = await this.s3Service.uploadFile(
            pdfBuffer,
            `assessment-report-${Date.now()}.pdf`,
            'application/pdf',
            'assessment-reports'
          );

          resolve(url);
        });

        // Generate PDF content
        this.generatePDFContent(doc, report, engineerProfile);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate PDF content
   */
  private generatePDFContent(
    doc: PDFKit.PDFDocument,
    report: AssessmentReport,
    engineerProfile: any
  ): void {
    // Header
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('NeuronHire Assessment Report', { align: 'center' });

    doc.moveDown();

    // Engineer Info
    doc
      .fontSize(14)
      .font('Helvetica')
      .text(`Engineer: ${engineerProfile.fullName}`)
      .text(`Date: ${new Date().toLocaleDateString()}`)
      .text(`Overall Score: ${report.overallScore}/100`)
      .text(`Tier: ${report.tier.toUpperCase()}`);

    doc.moveDown(2);

    // Dimension Scores
    doc.fontSize(16).font('Helvetica-Bold').text('Dimension Scores');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    Object.entries(report.dimensionScores).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      doc.text(`${label}: ${value}/100`);
    });

    doc.moveDown(2);

    // Strengths
    doc.fontSize(16).font('Helvetica-Bold').text('Key Strengths');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    report.strengths.forEach((strength, i) => {
      doc.text(`${i + 1}. ${strength}`);
    });

    doc.moveDown(2);

    // Areas for Improvement
    doc.fontSize(16).font('Helvetica-Bold').text('Areas for Improvement');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    report.weaknesses.forEach((weakness, i) => {
      doc.text(`${i + 1}. ${weakness}`);
    });

    doc.addPage();

    // Skill Gap Analysis
    doc.fontSize(16).font('Helvetica-Bold').text('Skill Gap Analysis');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    report.skillGapAnalysis.forEach((gap, i) => {
      doc.text(`${i + 1}. ${gap}`);
    });

    doc.moveDown(2);

    // Improvement Roadmap
    doc.fontSize(16).font('Helvetica-Bold').text('Improvement Roadmap');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    report.improvementRoadmap.forEach((item, i) => {
      doc
        .font('Helvetica-Bold')
        .text(`${i + 1}. ${item.area} (Priority: ${item.priority.toUpperCase()})`);
      doc.font('Helvetica');
      item.recommendations.forEach((rec) => {
        doc.text(`   • ${rec}`);
      });
      doc.moveDown();
    });

    doc.moveDown(2);

    // Next Steps
    doc.fontSize(16).font('Helvetica-Bold').text('Next Steps');
    doc.moveDown();
    doc.fontSize(12).font('Helvetica');
    report.nextSteps.forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`);
    });

    // Footer
    doc.moveDown(3);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Generated by NeuronHire Assessment System', { align: 'center' });
  }

  /**
   * Determine tier from score
   */
  private determineTier(score: number): string {
    if (score >= 85) return 'elite';
    if (score >= 70) return 'professional';
    if (score >= 60) return 'verified';
    if (score >= 40) return 'conditional';
    return 'rejected';
  }

  /**
   * Fallback report if AI generation fails
   */
  private getFallbackReport(assessmentData: any): AssessmentReport {
    return {
      overallScore: assessmentData.totalScore,
      tier: this.determineTier(assessmentData.totalScore),
      dimensionScores: {
        modelKnowledge: assessmentData.modelKnowledge,
        engineeringDepth: assessmentData.engineeringDepth,
        systemDesign: assessmentData.systemDesign,
        codingQuality: assessmentData.codingQuality,
        practicalApp: assessmentData.practicalApp,
        communication: assessmentData.communication
      },
      skillGapAnalysis: [
        'Review fundamental ML concepts',
        'Practice system design patterns',
        'Improve code optimization skills'
      ],
      improvementRoadmap: [
        {
          area: 'Technical Knowledge',
          priority: 'high',
          recommendations: [
            'Complete advanced ML courses',
            'Read research papers regularly'
          ]
        }
      ],
      strengths: ['Strong theoretical foundation', 'Good problem-solving skills'],
      weaknesses: ['Limited practical experience', 'Code optimization needs work'],
      nextSteps: [
        'Build more projects',
        'Contribute to open source',
        'Practice coding challenges'
      ]
    };
  }
}
