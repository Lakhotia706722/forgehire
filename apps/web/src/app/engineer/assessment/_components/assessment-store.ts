'use client';

export type AssessmentSection = 'mcq' | 'coding' | 'scenario';
export type QuestionStatus = 'unanswered' | 'answered' | 'flagged';

export interface MCQQuestion {
  id: string;
  number: number;
  text: string;
  options: string[];
  selectedOption: number | null;
  flagged: boolean;
}

export interface CodingTask {
  id: string;
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  code: string;
  output: string;
  running: boolean;
}

export interface AssessmentState {
  section: AssessmentSection;
  totalSeconds: number;
  secondsLeft: number;
  mcqQuestions: MCQQuestion[];
  currentMCQ: number;
  codingTasks: CodingTask[];
  currentCodingTask: number;
  scenarioText: string;
  tabSwitchCount: number;
  showTabWarning: boolean;
  showInactivityWarning: boolean;
  inactivitySecondsLeft: number;
  submitted: boolean;
}

export const MOCK_MCQ: MCQQuestion[] = Array.from({ length: 30 }, (_, i) => ({
  id: `q${i + 1}`,
  number: i + 1,
  text: `Question ${i + 1}: Which of the following best describes the attention mechanism in transformer models?`,
  options: [
    'A weighted sum of all input tokens based on learned similarity scores',
    'A recurrent computation over sequential token positions',
    'A convolutional filter applied across the token sequence',
    'A fixed positional encoding added to token embeddings',
  ],
  selectedOption: null,
  flagged: false,
}));

export const MOCK_CODING_TASKS: CodingTask[] = [
  {
    id: 'c1',
    title: 'Implement Semantic Chunking',
    description: `Given a long document string, implement a semantic chunking function that splits the text into meaningful chunks for RAG pipelines.

Your function should:
- Split on sentence boundaries, not arbitrary character counts
- Respect a maximum chunk size (in tokens, approximated as words/0.75)
- Overlap consecutive chunks by 10% to preserve context
- Return a list of chunk strings`,
    examples: [
      {
        input: 'text = "The quick brown fox. It jumped over the lazy dog. The dog barked.", max_tokens=10',
        output: '["The quick brown fox. It jumped", "jumped over the lazy dog.", "The dog barked."]',
        explanation: 'Chunks overlap by ~10% and respect sentence boundaries',
      },
    ],
    constraints: ['1 ≤ len(text) ≤ 100,000', '50 ≤ max_tokens ≤ 2000', 'Return at least 1 chunk'],
    code: `def semantic_chunk(text: str, max_tokens: int = 512) -> list[str]:
    """
    Split text into overlapping semantic chunks for RAG.
    
    Args:
        text: Input document text
        max_tokens: Maximum tokens per chunk (approx words / 0.75)
    
    Returns:
        List of text chunks
    """
    # Your implementation here
    pass
`,
    output: '',
    running: false,
  },
  {
    id: 'c2',
    title: 'Vector Similarity Search',
    description: 'Implement a brute-force cosine similarity search over a list of embeddings.',
    examples: [
      { input: 'query=[1,0,0], embeddings=[[1,0,0],[0,1,0],[0.7,0.7,0]], top_k=2', output: '[(0, 1.0), (2, 0.9899)]' },
    ],
    constraints: ['Embeddings are unit vectors', '1 ≤ top_k ≤ len(embeddings)'],
    code: `import numpy as np

def cosine_search(query: list[float], embeddings: list[list[float]], top_k: int = 5) -> list[tuple[int, float]]:
    """Return top_k (index, similarity) pairs."""
    # Your implementation here
    pass
`,
    output: '',
    running: false,
  },
  {
    id: 'c3',
    title: 'LLM Response Parser',
    description: 'Parse structured JSON from an LLM response that may contain markdown code blocks.',
    examples: [
      { input: 'response = "```json\\n{\\"key\\": \\"value\\"}\\n```"', output: '{"key": "value"}' },
    ],
    constraints: ['Handle both raw JSON and markdown-wrapped JSON', 'Return None on parse failure'],
    code: `import json
import re

def parse_llm_json(response: str) -> dict | None:
    """Extract and parse JSON from LLM response."""
    # Your implementation here
    pass
`,
    output: '',
    running: false,
  },
];
