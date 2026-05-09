import OpenAI from 'openai';
import { getEnv } from '../config/env';

export interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  categories: string[];
  notes: string;
}

export class ProductModerationService {
  private openai: OpenAI;

  constructor() {
    const env = getEnv();
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  /**
   * Moderate product content using OpenAI Moderation API
   */
  async moderateProduct(data: {
    name: string;
    tagline: string;
    description: string;
    tags: string[];
  }): Promise<ModerationResult> {
    try {
      // Combine all text fields for moderation
      const textToModerate = `
        Product Name: ${data.name}
        Tagline: ${data.tagline}
        Description: ${data.description}
        Tags: ${data.tags.join(', ')}
      `.trim();

      const moderation = await this.openai.moderations.create({
        input: textToModerate
      });

      const result = moderation.results[0];
      const flaggedCategories: string[] = [];

      // Check which categories were flagged
      if (result.categories.hate) flaggedCategories.push('hate');
      if (result.categories.harassment) flaggedCategories.push('harassment');
      if (result.categories['hate/threatening']) flaggedCategories.push('hate/threatening');
      if (result.categories['harassment/threatening']) flaggedCategories.push('harassment/threatening');
      if (result.categories['self-harm']) flaggedCategories.push('self-harm');
      if (result.categories['self-harm/intent']) flaggedCategories.push('self-harm/intent');
      if (result.categories['self-harm/instructions']) flaggedCategories.push('self-harm/instructions');
      if (result.categories.sexual) flaggedCategories.push('sexual');
      if (result.categories['sexual/minors']) flaggedCategories.push('sexual/minors');
      if (result.categories.violence) flaggedCategories.push('violence');
      if (result.categories['violence/graphic']) flaggedCategories.push('violence/graphic');

      const approved = !result.flagged;
      const notes = result.flagged
        ? `Content flagged for: ${flaggedCategories.join(', ')}`
        : 'Content approved';

      return {
        approved,
        flagged: result.flagged,
        categories: flaggedCategories,
        notes
      };
    } catch (error) {
      console.error('Moderation error:', error);
      // Fail open - allow content if moderation service fails
      return {
        approved: true,
        flagged: false,
        categories: [],
        notes: 'Moderation service unavailable - content allowed by default'
      };
    }
  }

  /**
   * Moderate product update
   */
  async moderateUpdate(data: {
    name?: string;
    tagline?: string;
    description?: string;
    tags?: string[];
  }): Promise<ModerationResult> {
    // Only moderate fields that are being updated
    const textParts: string[] = [];

    if (data.name) textParts.push(`Product Name: ${data.name}`);
    if (data.tagline) textParts.push(`Tagline: ${data.tagline}`);
    if (data.description) textParts.push(`Description: ${data.description}`);
    if (data.tags && data.tags.length > 0) textParts.push(`Tags: ${data.tags.join(', ')}`);

    if (textParts.length === 0) {
      return {
        approved: true,
        flagged: false,
        categories: [],
        notes: 'No text content to moderate'
      };
    }

    const textToModerate = textParts.join('\n');

    try {
      const moderation = await this.openai.moderations.create({
        input: textToModerate
      });

      const result = moderation.results[0];
      const flaggedCategories: string[] = [];

      if (result.categories.hate) flaggedCategories.push('hate');
      if (result.categories.harassment) flaggedCategories.push('harassment');
      if (result.categories['hate/threatening']) flaggedCategories.push('hate/threatening');
      if (result.categories['harassment/threatening']) flaggedCategories.push('harassment/threatening');
      if (result.categories['self-harm']) flaggedCategories.push('self-harm');
      if (result.categories['self-harm/intent']) flaggedCategories.push('self-harm/intent');
      if (result.categories['self-harm/instructions']) flaggedCategories.push('self-harm/instructions');
      if (result.categories.sexual) flaggedCategories.push('sexual');
      if (result.categories['sexual/minors']) flaggedCategories.push('sexual/minors');
      if (result.categories.violence) flaggedCategories.push('violence');
      if (result.categories['violence/graphic']) flaggedCategories.push('violence/graphic');

      const approved = !result.flagged;
      const notes = result.flagged
        ? `Content flagged for: ${flaggedCategories.join(', ')}`
        : 'Content approved';

      return {
        approved,
        flagged: result.flagged,
        categories: flaggedCategories,
        notes
      };
    } catch (error) {
      console.error('Moderation error:', error);
      return {
        approved: true,
        flagged: false,
        categories: [],
        notes: 'Moderation service unavailable - content allowed by default'
      };
    }
  }
}
