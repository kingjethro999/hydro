/**
 * Complexity analyzer for detecting complex functions and code patterns
 */

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, ComplexityRules, ComplexityMetrics } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export class ComplexityAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze files for complexity issues
   */
  public async analyze(
    files: FileInfo[],
    rules?: ComplexityRules
  ): Promise<Issue[]> {
    if (!rules) return [];

    const issues: Issue[] = [];
    const codeFiles = files.filter(f => this.isAnalyzableFile(f));

    logger.debug(`Analyzing complexity for ${codeFiles.length} files`);

    for (const file of codeFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content, rules);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze complexity for ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  /**
   * Analyze a single file for complexity issues
   */
  private async analyzeFile(
    file: FileInfo,
    content: string,
    rules: ComplexityRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    // Check file size
    if (lines.length > (rules.maxFunctionLines * 5)) { // Rough heuristic for "god files"
      issues.push({
        id: `god-file-${file.relativePath}`,
        type: 'god-file',
        severity: 'high',
        category: 'architecture',
        title: 'Large file detected',
        description: `File has ${lines.length} lines, consider breaking it into smaller modules`,
        file: file.relativePath,
        suggestion: 'Split this file into smaller, focused modules',
        autoFixable: false,
      });
    }

    // Analyze functions
    const functions = this.extractFunctions(content, file.language || 'javascript');
    
    for (const func of functions) {
      // Function length check
      if (func.lineCount > rules.maxFunctionLines) {
        issues.push({
          id: `long-function-${file.relativePath}-${func.startLine}`,
          type: 'complex-function',
          severity: func.lineCount > rules.maxFunctionLines * 2 ? 'high' : 'medium',
          category: 'maintainability',
          title: 'Function too long',
          description: `Function '${func.name}' has ${func.lineCount} lines (max: ${rules.maxFunctionLines})`,
          file: file.relativePath,
          line: func.startLine,
          suggestion: 'Break this function into smaller, focused functions',
          autoFixable: false,
        });
      }

      // Parameter count check
      if (rules.maxParameterCount && func.parameterCount > rules.maxParameterCount) {
        issues.push({
          id: `many-params-${file.relativePath}-${func.startLine}`,
          type: 'complex-function',
          severity: 'medium',
          category: 'maintainability',
          title: 'Too many parameters',
          description: `Function '${func.name}' has ${func.parameterCount} parameters (max: ${rules.maxParameterCount})`,
          file: file.relativePath,
          line: func.startLine,
          suggestion: 'Consider using an options object or splitting the function',
          autoFixable: false,
        });
      }

      // Cyclomatic complexity check (simplified)
      const complexity = this.calculateCyclomaticComplexity(func.body);
      if (rules.maxCyclomaticComplexity && complexity > rules.maxCyclomaticComplexity) {
        issues.push({
          id: `complex-function-${file.relativePath}-${func.startLine}`,
          type: 'complex-function',
          severity: complexity > rules.maxCyclomaticComplexity * 2 ? 'high' : 'medium',
          category: 'maintainability',
          title: 'High cyclomatic complexity',
          description: `Function '${func.name}' has complexity ${complexity} (max: ${rules.maxCyclomaticComplexity})`,
          file: file.relativePath,
          line: func.startLine,
          suggestion: 'Simplify control flow and reduce branching',
          autoFixable: false,
        });
      }

      // Nesting depth check
      const nestingDepth = this.calculateNestingDepth(func.body);
      if (nestingDepth > 4) {
        issues.push({
          id: `deep-nesting-${file.relativePath}-${func.startLine}`,
          type: 'complex-function',
          severity: nestingDepth > 6 ? 'high' : 'medium',
          category: 'maintainability',
          title: 'Deep nesting detected',
          description: `Function '${func.name}' has nesting depth ${nestingDepth} (recommended max: 4)`,
          file: file.relativePath,
          line: func.startLine,
          suggestion: 'Use early returns and extract nested logic into functions',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Calculate project complexity metrics
   */
  public async calculateMetrics(files: FileInfo[]): Promise<ComplexityMetrics> {
    const codeFiles = files.filter(f => this.isAnalyzableFile(f));
    let totalFunctions = 0;
    let totalFunctionLines = 0;
    let maxFunctionLength = 0;
    let totalComplexity = 0;
    let maxNestingDepth = 0;

    for (const file of codeFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const functions = this.extractFunctions(content, file.language || 'javascript');

        for (const func of functions) {
          totalFunctions++;
          totalFunctionLines += func.lineCount;
          maxFunctionLength = Math.max(maxFunctionLength, func.lineCount);
          
          const complexity = this.calculateCyclomaticComplexity(func.body);
          totalComplexity += complexity;

          const nestingDepth = this.calculateNestingDepth(func.body);
          maxNestingDepth = Math.max(maxNestingDepth, nestingDepth);
        }
      } catch (error) {
        logger.debug(`Failed to calculate metrics for ${file.path}: ${error}`);
      }
    }

    return {
      averageFunctionLength: totalFunctions > 0 ? Math.round(totalFunctionLines / totalFunctions) : 0,
      maxFunctionLength,
      cyclomaticComplexity: totalFunctions > 0 ? Math.round(totalComplexity / totalFunctions) : 0,
      nestingDepth: maxNestingDepth,
    };
  }

  /**
   * Extract functions from code content
   */
  private extractFunctions(content: string, language: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const lines = content.split('\n');

    // Simple regex patterns for different languages
    const patterns = this.getFunctionPatterns(language);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      
      for (const pattern of patterns) {
        const match = line.match(pattern.regex);
        if (match) {
          const functionName = match[pattern.nameGroup] || 'anonymous';
          const parameterString = match[pattern.paramsGroup] || '';
          const parameterCount = parameterString ? 
            parameterString.split(',').filter(p => p.trim()).length : 0;

          // Find function end
          const functionEnd = this.findFunctionEnd(lines, i, language);
          const lineCount = functionEnd - i + 1;
          const body = lines.slice(i, functionEnd + 1).join('\n');

          functions.push({
            name: functionName,
            startLine: i + 1,
            endLine: functionEnd + 1,
            lineCount,
            parameterCount,
            body,
          });

          break; // Found a match, move to next line
        }
      }
    }

    return functions;
  }

  /**
   * Get function regex patterns for different languages
   */
  private getFunctionPatterns(language: string): { regex: RegExp; nameGroup: number; paramsGroup: number }[] {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return [
          // function declaration: function name(params) {
          { regex: /^function\s+(\w+)\s*\(([^)]*)\)/, nameGroup: 1, paramsGroup: 2 },
          // arrow function: const name = (params) => {
          { regex: /^(?:const|let|var)\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>/, nameGroup: 1, paramsGroup: 2 },
          // method: methodName(params) {
          { regex: /^(\w+)\s*\(([^)]*)\)\s*\{/, nameGroup: 1, paramsGroup: 2 },
          // class method: public/private methodName(params) {
          { regex: /^(?:public|private|protected)?\s*(\w+)\s*\(([^)]*)\)\s*\{/, nameGroup: 1, paramsGroup: 2 },
        ];
      case 'python':
        return [
          // def function_name(params):
          { regex: /^def\s+(\w+)\s*\(([^)]*)\):/, nameGroup: 1, paramsGroup: 2 },
        ];
      case 'java':
        return [
          // public/private returnType methodName(params) {
          { regex: /^(?:public|private|protected)?\s*(?:static\s+)?[\w<>]+\s+(\w+)\s*\(([^)]*)\)\s*\{/, nameGroup: 1, paramsGroup: 2 },
        ];
      default:
        return [
          // Generic function pattern
          { regex: /^(?:function\s+)?(\w+)\s*\(([^)]*)\)/, nameGroup: 1, paramsGroup: 2 },
        ];
    }
  }

  /**
   * Find the end of a function
   */
  private findFunctionEnd(lines: string[], startIndex: number, language: string): number {
    let braceCount = 0;
    let inFunction = false;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      
      // Count braces for languages that use them
      if (['javascript', 'typescript', 'java', 'go'].includes(language)) {
        for (const char of line) {
          if (char === '{') {
            braceCount++;
            inFunction = true;
          } else if (char === '}') {
            braceCount--;
            if (inFunction && braceCount === 0) {
              return i;
            }
          }
        }
      } else if (language === 'python') {
        // Python uses indentation
        if (inFunction && line.trim() && !line.startsWith(' ') && !line.startsWith('\t')) {
          return i - 1;
        }
        if (line.trim().startsWith('def ')) {
          inFunction = true;
        }
      }
    }

    return lines.length - 1;
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  private calculateCyclomaticComplexity(code: string): number {
    // Count decision points
    const decisionKeywords = [
      'if', 'else', 'elif', 'while', 'for', 'switch', 'case',
      'catch', 'try', '&&', '||', '?', '??', 'and', 'or'
    ];

    let complexity = 1; // Base complexity

    for (const keyword of decisionKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = code.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Calculate nesting depth
   */
  private calculateNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of code) {
      if (char === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === '}') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Check if file can be analyzed for complexity
   */
  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php', 'ruby'
    ];
    return file.language ? analyzableLanguages.includes(file.language) : false;
  }
}

interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  parameterCount: number;
  body: string;
}
