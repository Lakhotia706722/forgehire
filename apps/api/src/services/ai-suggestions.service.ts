import Anthropic from '@anthropic-ai/sdk';
import { getEnv } from '../config/env';

export class AISuggestionsService {
  private anthropic: Anthropic;

  constructor() {
    const env = getEnv();
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate AI-powered profile suggestions based on missing sections
   */
  async generateProfileSuggestions(
    missingFields: string[],
    existingData: any
  ): Promise<string[]> {
    if (missingFields.length === 0) {
      return ['Your profile is complete! Great job!'];
    }

    const prompt = `You are a career advisor helping AI engineers improve their profiles on NeuronHire, an AI talent marketplace.

Current profile status:
- Missing sections: ${missingFields.join(', ')}
- Existing data: ${JSON.stringify(existingData, null, 2)}

Generate 3-5 specific, actionable tips to help this engineer complete their profile. Focus on:
1. What to add in the missing sections
2. How to make their profile stand out
3. Specific examples relevant to AI engineering

Keep each tip concise (1-2 sentences) and practical. Return only the tips as a JSON array of strings.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        // Extract JSON array from the response
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Fallback suggestions
      return this.getFallbackSuggestions(missingFields);
    } catch (error) {
      console.error('AI suggestions error:', error);
      return this.getFallbackSuggestions(missingFields);
    }
  }

  /**
   * Generate project description suggestions
   */
  async generateProjectSuggestions(
    projectTitle: string,
    techStack: string[]
  ): Promise<string> {
    const prompt = `Generate a compelling project description template for an AI engineering project titled "${projectTitle}" using technologies: ${techStack.join(', ')}.

Include sections for:
1. What the project does
2. The problem it solves
3. Key technical highlights

Keep it professional and concise (3-4 sentences). Return only the description text.`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }

      return '';
    } catch (error) {
      console.error('Project suggestion error:', error);
      return '';
    }
  }

  /**
   * Fallback suggestions when AI is unavailable
   */
  private getFallbackSuggestions(missingFields: string[]): string[] {
    const suggestions: string[] = [];

    if (missingFields.includes('Basic Information')) {
      suggestions.push('Add a compelling bio that highlights your AI expertise and what makes you unique');
    }

    if (missingFields.includes('Skills') || missingFields.includes('More Skills')) {
      suggestions.push('List your top AI/ML skills with honest proficiency levels - companies value transparency');
    }

    if (missingFields.includes('Work Experience')) {
      suggestions.push('Add your work experience, focusing on AI-related projects and measurable achievements');
    }

    if (missingFields.includes('Projects') || missingFields.includes('More Projects')) {
      suggestions.push('Showcase projects with live demos and GitHub links - visual proof builds trust');
    }

    if (missingFields.includes('Pricing')) {
      suggestions.push('Research market rates for your skill level and set competitive pricing');
    }

    if (missingFields.includes('Payment Details')) {
      suggestions.push('Add your UPI ID to enable seamless payments from companies');
    }

    if (missingFields.includes('KYC Verification')) {
      suggestions.push('Complete KYC verification to unlock premium opportunities and build credibility');
    }

    return suggestions;
  }
}
