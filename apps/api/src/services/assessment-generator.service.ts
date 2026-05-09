import Anthropic from '@anthropic-ai/sdk';
import { getMongoDB } from '../config/mongodb';
import { getEnv } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

interface CodingTask {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  testCases: Array<{
    input: any;
    expectedOutput: any;
    hidden: boolean;
  }>;
  starterCode: string;
  timeLimit: number; // seconds
}

interface CaseScenario {
  id: string;
  title: string;
  scenario: string;
  questions: string[];
  evaluationCriteria: string[];
}

export class AssessmentGeneratorService {
  private anthropic: Anthropic;
  private questionBankCollection = 'question_bank';

  constructor() {
    const env = getEnv();
    this.anthropic = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Generate a complete assessment based on engineer's skills and experience
   */
  async generateAssessment(
    skills: string[],
    experienceLevel: 'junior' | 'mid' | 'senior'
  ): Promise<{
    questions: MCQQuestion[];
    codingTasks: CodingTask[];
    caseScenario: CaseScenario;
  }> {
    // Get MCQ questions from bank
    const questions = await this.selectMCQQuestions(skills, experienceLevel, 30);

    // Generate coding tasks
    const codingTasks = await this.generateCodingTasks(skills, experienceLevel);

    // Generate case scenario
    const caseScenario = await this.generateCaseScenario(skills, experienceLevel);

    return {
      questions,
      codingTasks,
      caseScenario
    };
  }

  /**
   * Select MCQ questions from MongoDB question bank
   */
  private async selectMCQQuestions(
    skills: string[],
    experienceLevel: string,
    count: number
  ): Promise<MCQQuestion[]> {
    const db = getMongoDB();
    const collection = db.collection(this.questionBankCollection);

    // Map experience level to difficulty distribution
    const difficultyDistribution = this.getDifficultyDistribution(experienceLevel);

    const questions: MCQQuestion[] = [];

    // Get questions for each difficulty level
    for (const [difficulty, percentage] of Object.entries(difficultyDistribution)) {
      const numQuestions = Math.floor((count * percentage) / 100);

      const query: any = {
        difficulty,
        category: { $in: skills }
      };

      const selectedQuestions = await collection
        .aggregate([
          { $match: query },
          { $sample: { size: numQuestions } }
        ])
        .toArray();

      questions.push(...(selectedQuestions as MCQQuestion[]));
    }

    // If we don't have enough questions, fill with general AI questions
    if (questions.length < count) {
      const remaining = count - questions.length;
      const generalQuestions = await collection
        .aggregate([
          { $match: { category: 'general_ai' } },
          { $sample: { size: remaining } }
        ])
        .toArray();

      questions.push(...(generalQuestions as MCQQuestion[]));
    }

    // Shuffle questions
    return this.shuffleArray(questions).slice(0, count);
  }

  /**
   * Generate coding tasks using Claude API
   */
  private async generateCodingTasks(
    skills: string[],
    experienceLevel: string
  ): Promise<CodingTask[]> {
    const numTasks = experienceLevel === 'senior' ? 3 : 2;

    const prompt = `Generate ${numTasks} Python coding tasks for an AI/ML engineer with ${experienceLevel} experience level and skills in: ${skills.join(', ')}.

Requirements:
1. Tasks should be practical and relevant to AI/ML engineering
2. Include clear problem descriptions
3. Provide test cases (at least 3 visible, 2 hidden)
4. Include starter code template
5. Set appropriate time limits (15-30 minutes per task)
6. Difficulty should match experience level

Return as JSON array with this structure:
[
  {
    "title": "Task title",
    "description": "Detailed description",
    "difficulty": "easy|medium|hard",
    "testCases": [
      {"input": {...}, "expectedOutput": {...}, "hidden": false}
    ],
    "starterCode": "# Python starter code",
    "timeLimit": 1800
  }
]`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const tasks = JSON.parse(jsonMatch[0]);
          return tasks.map((task: any) => ({
            ...task,
            id: uuidv4()
          }));
        }
      }

      return this.getFallbackCodingTasks(experienceLevel);
    } catch (error) {
      console.error('Coding task generation error:', error);
      return this.getFallbackCodingTasks(experienceLevel);
    }
  }

  /**
   * Generate case scenario using Claude API
   */
  private async generateCaseScenario(
    skills: string[],
    experienceLevel: string
  ): Promise<CaseScenario> {
    const prompt = `Generate a realistic AI/ML case study scenario for a ${experienceLevel} engineer with skills in: ${skills.join(', ')}.

The scenario should:
1. Present a real-world business problem
2. Require system design thinking
3. Test practical application of AI/ML concepts
4. Include 3-4 specific questions to answer
5. Define clear evaluation criteria

Return as JSON:
{
  "title": "Scenario title",
  "scenario": "Detailed scenario description (300-500 words)",
  "questions": ["Question 1", "Question 2", "Question 3"],
  "evaluationCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
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
          const scenario = JSON.parse(jsonMatch[0]);
          return {
            ...scenario,
            id: uuidv4()
          };
        }
      }

      return this.getFallbackCaseScenario();
    } catch (error) {
      console.error('Case scenario generation error:', error);
      return this.getFallbackCaseScenario();
    }
  }

  /**
   * Get difficulty distribution based on experience level
   */
  private getDifficultyDistribution(experienceLevel: string): Record<string, number> {
    switch (experienceLevel) {
      case 'junior':
        return { easy: 50, medium: 40, hard: 10 };
      case 'mid':
        return { easy: 30, medium: 50, hard: 20 };
      case 'senior':
        return { easy: 20, medium: 40, hard: 40 };
      default:
        return { easy: 40, medium: 40, hard: 20 };
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Fallback coding tasks if AI generation fails
   */
  private getFallbackCodingTasks(experienceLevel: string): CodingTask[] {
    return [
      {
        id: uuidv4(),
        title: 'Data Preprocessing Pipeline',
        description: 'Implement a data preprocessing function that handles missing values, normalizes features, and encodes categorical variables.',
        difficulty: experienceLevel === 'junior' ? 'easy' : 'medium',
        testCases: [
          {
            input: { data: [[1, 2, 'A'], [null, 3, 'B']] },
            expectedOutput: { processed: true },
            hidden: false
          }
        ],
        starterCode: 'def preprocess_data(data):\n    # Your code here\n    pass',
        timeLimit: 1800
      }
    ];
  }

  /**
   * Fallback case scenario if AI generation fails
   */
  private getFallbackCaseScenario(): CaseScenario {
    return {
      id: uuidv4(),
      title: 'E-commerce Recommendation System',
      scenario: 'You are tasked with building a recommendation system for an e-commerce platform...',
      questions: [
        'What approach would you take for this recommendation system?',
        'How would you handle cold start problems?',
        'What metrics would you use to evaluate the system?'
      ],
      evaluationCriteria: [
        'Technical approach and feasibility',
        'Consideration of edge cases',
        'Scalability and performance'
      ]
    };
  }
}
