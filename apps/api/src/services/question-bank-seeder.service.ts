import { getMongoDB } from "../config/mongodb";
import { v4 as uuidv4 } from "uuid";

export class QuestionBankSeederService {
  private questionBankCollection = "question_bank";

  /**
   * Seed MongoDB with 200 starter questions across 10 AI skill categories
   */
  async seedQuestionBank(): Promise<void> {
    const db = getMongoDB();
    const collection = db.collection(this.questionBankCollection);

    // Check if already seeded
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`Question bank already seeded with ${count} questions`);
      return;
    }

    const categories = [
      "machine_learning",
      "deep_learning",
      "nlp",
      "computer_vision",
      "reinforcement_learning",
      "mlops",
      "data_engineering",
      "model_deployment",
      "ai_ethics",
      "general_ai",
    ];

    const questions = [];

    for (const category of categories) {
      // Generate 20 questions per category
      questions.push(...this.generateQuestionsForCategory(category, 20));
    }

    await collection.insertMany(questions);
    console.log(
      `✅ Seeded ${questions.length} questions across ${categories.length} categories`,
    );
  }

  /**
   * Generate questions for a specific category
   */
  private generateQuestionsForCategory(category: string, count: number): any[] {
    const questions = [];
    const difficulties: Array<"easy" | "medium" | "hard"> = [
      "easy",
      "medium",
      "hard",
    ];

    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[i % 3];
      questions.push(this.createQuestion(category, difficulty, i));
    }

    return questions;
  }

  /**
   * Create a sample question
   */
  private createQuestion(
    category: string,
    difficulty: string,
    index: number,
  ): any {
    const questionTemplates = this.getQuestionTemplates(category);
    const template = questionTemplates[index % questionTemplates.length];

    return {
      _id: uuidv4(),
      category,
      difficulty,
      ...template,
    };
  }

  /**
   * Get question templates for each category
   */
  private getQuestionTemplates(category: string): any[] {
    const templates: Record<string, any[]> = {
      machine_learning: [
        {
          question:
            "What is the primary purpose of regularization in machine learning?",
          options: [
            "To increase model complexity",
            "To prevent overfitting",
            "To speed up training",
            "To reduce dataset size",
          ],
          correctAnswer: 1,
          explanation:
            "Regularization adds a penalty term to prevent overfitting by discouraging complex models.",
        },
        {
          question:
            "Which algorithm is best suited for binary classification with linearly separable data?",
          options: ["K-Means", "Linear SVM", "DBSCAN", "PCA"],
          correctAnswer: 1,
          explanation:
            "Linear SVM finds the optimal hyperplane for linearly separable binary classification.",
        },
        {
          question: "What does the bias-variance tradeoff represent?",
          options: [
            "Training vs testing time",
            "Model complexity vs generalization",
            "Accuracy vs precision",
            "Data size vs model size",
          ],
          correctAnswer: 1,
          explanation:
            "The bias-variance tradeoff balances model complexity (variance) with generalization ability (bias).",
        },
      ],
      deep_learning: [
        {
          question:
            "What is the vanishing gradient problem in deep neural networks?",
          options: [
            "Gradients become too large",
            "Gradients become too small in early layers",
            "Gradients disappear completely",
            "Gradients oscillate",
          ],
          correctAnswer: 1,
          explanation:
            "Vanishing gradients occur when gradients become extremely small in early layers, preventing effective learning.",
        },
        {
          question:
            "Which activation function helps mitigate the vanishing gradient problem?",
          options: ["Sigmoid", "Tanh", "ReLU", "Linear"],
          correctAnswer: 2,
          explanation:
            "ReLU maintains gradients for positive values, helping prevent vanishing gradients.",
        },
      ],
      nlp: [
        {
          question: "What is the purpose of attention mechanisms in NLP?",
          options: [
            "To reduce model size",
            "To focus on relevant parts of input",
            "To speed up training",
            "To tokenize text",
          ],
          correctAnswer: 1,
          explanation:
            "Attention mechanisms allow models to focus on relevant parts of the input sequence.",
        },
        {
          question: "What does BERT stand for?",
          options: [
            "Binary Encoded Representation of Text",
            "Bidirectional Encoder Representations from Transformers",
            "Basic Embedding for Recurrent Transformers",
            "Batch Encoded Recursive Tokens",
          ],
          correctAnswer: 1,
          explanation:
            "BERT uses bidirectional transformers to create contextual word embeddings.",
        },
      ],
      computer_vision: [
        {
          question:
            "What is the primary advantage of convolutional layers in CNNs?",
          options: [
            "Faster training",
            "Parameter sharing and spatial invariance",
            "Better accuracy",
            "Smaller model size",
          ],
          correctAnswer: 1,
          explanation:
            "Convolutional layers share parameters across spatial locations, reducing parameters and capturing spatial patterns.",
        },
      ],
      mlops: [
        {
          question: "What is model drift in production ML systems?",
          options: [
            "Model moving to different servers",
            "Performance degradation over time",
            "Model size increasing",
            "Training time increasing",
          ],
          correctAnswer: 1,
          explanation:
            "Model drift occurs when model performance degrades due to changes in data distribution.",
        },
      ],
      general_ai: [
        {
          question:
            "What is the difference between supervised and unsupervised learning?",
          options: [
            "Training time",
            "Presence of labeled data",
            "Model complexity",
            "Dataset size",
          ],
          correctAnswer: 1,
          explanation:
            "Supervised learning uses labeled data, while unsupervised learning finds patterns in unlabeled data.",
        },
      ],
    };

    return templates[category] || templates.general_ai;
  }
}
