import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface CodeEvaluationResult {
  passed: boolean;
  testResults: Array<{
    testCase: number;
    passed: boolean;
    output: any;
    expected: any;
    error?: string;
  }>;
  executionTime: number;
  memoryUsed: number;
  correctness: number; // 0-100
  efficiency: number; // 0-100
}

export class CodeEvaluatorService {
  private readonly TIMEOUT = 30000; // 30 seconds
  private readonly MEMORY_LIMIT = '256m';
  private readonly TEMP_DIR = '/tmp/code-eval';

  /**
   * Evaluate Python code in Docker container
   */
  async evaluateCode(
    code: string,
    testCases: Array<{ input: any; expectedOutput: any; hidden: boolean }>
  ): Promise<CodeEvaluationResult> {
    const executionId = uuidv4();
    const codeFile = join(this.TEMP_DIR, `${executionId}.py`);
    const testFile = join(this.TEMP_DIR, `${executionId}_test.py`);

    try {
      // Ensure temp directory exists
      await mkdir(this.TEMP_DIR, { recursive: true });

      // Write code to file
      await writeFile(codeFile, code);

      // Generate test runner
      const testRunner = this.generateTestRunner(code, testCases);
      await writeFile(testFile, testRunner);

      // Run in Docker container
      const startTime = Date.now();
      const result = await this.runInDocker(executionId, testFile);
      const executionTime = Date.now() - startTime;

      // Parse results
      const testResults = this.parseTestResults(result.stdout, testCases);
      const correctness = this.calculateCorrectness(testResults);
      const efficiency = this.calculateEfficiency(executionTime, result.memoryUsed);

      return {
        passed: testResults.every(t => t.passed),
        testResults,
        executionTime,
        memoryUsed: result.memoryUsed,
        correctness,
        efficiency
      };
    } catch (error: any) {
      console.error('Code evaluation error:', error);
      return {
        passed: false,
        testResults: testCases.map((_, i) => ({
          testCase: i,
          passed: false,
          output: null,
          expected: testCases[i].expectedOutput,
          error: error.message
        })),
        executionTime: 0,
        memoryUsed: 0,
        correctness: 0,
        efficiency: 0
      };
    } finally {
      // Cleanup
      try {
        await unlink(codeFile);
        await unlink(testFile);
      } catch (_e) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Run code in Docker container
   */
  private async runInDocker(
    executionId: string,
    _testFile: string
  ): Promise<{ stdout: string; stderr: string; memoryUsed: number }> {
    const dockerCommand = `docker run --rm \
      --memory=${this.MEMORY_LIMIT} \
      --cpus=1 \
      --network=none \
      --read-only \
      --tmpfs /tmp \
      -v ${this.TEMP_DIR}:/code:ro \
      python:3.11-slim \
      timeout ${this.TIMEOUT / 1000}s python /code/${executionId}_test.py`;

    try {
      const { stdout, stderr } = await execAsync(dockerCommand, {
        timeout: this.TIMEOUT,
        maxBuffer: 1024 * 1024 // 1MB
      });

      // Get memory usage (simplified - in production, use Docker stats)
      const memoryUsed = this.estimateMemoryUsage(stdout);

      return { stdout, stderr, memoryUsed };
    } catch (error: any) {
      if (error.killed) {
        throw new Error('Execution timeout exceeded');
      }
      throw error;
    }
  }

  /**
   * Generate test runner Python code
   */
  private generateTestRunner(
    userCode: string,
    testCases: Array<{ input: any; expectedOutput: any }>
  ): string {
    return `
import json
import sys
import traceback

# User code
${userCode}

# Test cases
test_cases = ${JSON.stringify(testCases)}

results = []

for i, test_case in enumerate(test_cases):
    try:
        # Execute user function with test input
        result = main(test_case['input'])
        
        passed = result == test_case['expectedOutput']
        
        results.append({
            'testCase': i,
            'passed': passed,
            'output': result,
            'expected': test_case['expectedOutput']
        })
    except Exception as e:
        results.append({
            'testCase': i,
            'passed': False,
            'output': None,
            'expected': test_case['expectedOutput'],
            'error': str(e)
        })

print(json.dumps(results))
`;
  }

  /**
   * Parse test results from stdout
   */
  private parseTestResults(
    stdout: string,
    testCases: Array<{ input: any; expectedOutput: any; hidden: boolean }>
  ): Array<{
    testCase: number;
    passed: boolean;
    output: any;
    expected: any;
    error?: string;
  }> {
    try {
      const results = JSON.parse(stdout);
      return results.map((r: any, i: number) => ({
        ...r,
        hidden: testCases[i].hidden
      }));
    } catch (_error) {
      return testCases.map((tc, i) => ({
        testCase: i,
        passed: false,
        output: null,
        expected: tc.expectedOutput,
        error: 'Failed to parse test results'
      }));
    }
  }

  /**
   * Calculate correctness score (0-100)
   */
  private calculateCorrectness(
    testResults: Array<{ passed: boolean }>
  ): number {
    const passedCount = testResults.filter(t => t.passed).length;
    return Math.round((passedCount / testResults.length) * 100);
  }

  /**
   * Calculate efficiency score (0-100)
   */
  private calculateEfficiency(executionTime: number, memoryUsed: number): number {
    // Time score (faster is better, baseline 5 seconds)
    const timeScore = Math.max(0, 100 - (executionTime / 5000) * 100);

    // Memory score (less is better, baseline 128MB)
    const memoryScore = Math.max(0, 100 - (memoryUsed / (128 * 1024 * 1024)) * 100);

    // Weighted average
    return Math.round(timeScore * 0.6 + memoryScore * 0.4);
  }

  /**
   * Estimate memory usage from output (simplified)
   */
  private estimateMemoryUsage(stdout: string): number {
    // In production, use Docker stats API
    // For now, estimate based on output size
    return stdout.length * 100; // Rough estimate
  }

  /**
   * Check code plagiarism using semantic similarity
   */
  async checkPlagiarism(
    code: string,
    knownSolutions: string[]
  ): Promise<{ isPlagiarized: boolean; similarity: number; matchedSolution?: string }> {
    // Simplified plagiarism check
    // In production, use sentence-transformers or similar
    
    let maxSimilarity = 0;
    let matchedSolution: string | undefined;

    for (const solution of knownSolutions) {
      const similarity = this.calculateCodeSimilarity(code, solution);
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        matchedSolution = solution;
      }
    }

    return {
      isPlagiarized: maxSimilarity > 0.7, // 70% threshold
      similarity: maxSimilarity,
      matchedSolution: maxSimilarity > 0.7 ? matchedSolution : undefined
    };
  }

  /**
   * Calculate code similarity (simplified)
   */
  private calculateCodeSimilarity(code1: string, code2: string): number {
    // Remove whitespace and comments for comparison
    const normalize = (code: string) => {
      return code
        .replace(/\s+/g, ' ')
        .replace(/#.*/g, '')
        .replace(/""".*/g, '')
        .trim()
        .toLowerCase();
    };

    const normalized1 = normalize(code1);
    const normalized2 = normalize(code2);

    // Simple Levenshtein distance ratio
    const maxLength = Math.max(normalized1.length, normalized2.length);
    const distance = this.levenshteinDistance(normalized1, normalized2);
    
    return 1 - distance / maxLength;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
