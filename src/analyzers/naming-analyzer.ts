/**
 * Naming analyzer for detecting naming convention violations
 */

import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { Issue, NamingRules } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

interface NamingPattern {
  regex: RegExp;
  type: string;
  description: string;
}

export class NamingAnalyzer {
  private fileScanner = new FileScanner();

  /**
   * Analyze files for naming convention violations
   */
  public async analyze(
    files: FileInfo[],
    rules: NamingRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const codeFiles = files.filter(f => this.isAnalyzableFile(f));

    logger.debug(`Analyzing naming conventions for ${codeFiles.length} files`);

    for (const file of codeFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content, rules);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze naming for ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  /**
   * Analyze a single file for naming violations
   */
  private async analyzeFile(
    file: FileInfo,
    content: string,
    rules: NamingRules
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    // Get naming patterns for the target style
    const patterns = this.getNamingPatterns(file.language || 'javascript');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      if (!line) continue;
      
      const lineNumber = lineIndex + 1;

      // Check each naming pattern
      for (const pattern of patterns) {
        const matches = line.matchAll(pattern.regex);
        
        for (const match of matches) {
          const identifier = match[1];
          if (!identifier) continue;
          
          // Skip exceptions
          if (rules.exceptions?.includes(identifier)) {
            continue;
          }

          // Check if identifier follows the required naming style
          if (!this.followsNamingStyle(identifier, rules.style, pattern.type)) {
            const expectedStyle = this.convertToNamingStyle(identifier, rules.style);
            
            issues.push({
              id: `naming-${file.relativePath}-${lineNumber}-${identifier}`,
              type: 'naming-violation',
              severity: 'low',
              category: 'maintainability',
              title: `${pattern.description} naming violation`,
              description: `'${identifier}' should follow ${rules.style} convention`,
              file: file.relativePath,
              line: lineNumber,
              column: match.index ?? 0, // Provide fallback for undefined
              suggestion: `Rename '${identifier}' to '${expectedStyle}'`,
              autoFixable: true,
            });
          }
        }
      }

      // Check for specific anti-patterns
      const antiPatternIssues = this.checkAntiPatterns(line, lineNumber, file.relativePath);
      issues.push(...antiPatternIssues);
    }

    return issues;
  }

  /**
   * Get naming patterns for different languages
   */
  private getNamingPatterns(language: string): NamingPattern[] {
    const basePatterns: NamingPattern[] = [
      {
        regex: /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        type: 'variable',
        description: 'Variable',
      },
      {
        regex: /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        type: 'function',
        description: 'Function',
      },
      {
        regex: /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
        type: 'class',
        description: 'Class',
      },
      {
        regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\{/g,
        type: 'function',
        description: 'Method',
      },
    ];

    switch (language) {
      case 'javascript':
      case 'typescript':
        return [
          ...basePatterns,
          {
            regex: /\binterface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            type: 'interface',
            description: 'Interface',
          },
          {
            regex: /\btype\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            type: 'type',
            description: 'Type alias',
          },
          {
            regex: /\benum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            type: 'enum',
            description: 'Enum',
          },
        ];

      case 'python':
        return [
          {
            regex: /\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
            type: 'function',
            description: 'Function',
          },
          {
            regex: /\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
            type: 'class',
            description: 'Class',
          },
          {
            regex: /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm,
            type: 'variable',
            description: 'Variable',
          },
        ];

      case 'java':
        return [
          {
            regex: /\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            type: 'class',
            description: 'Class',
          },
          {
            regex: /\binterface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
            type: 'interface',
            description: 'Interface',
          },
          {
            regex: /\b(?:public|private|protected)?\s*(?:static\s+)?[\w<>]+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            type: 'method',
            description: 'Method',
          },
          {
            regex: /\b(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?[\w<>]+\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=;]/g,
            type: 'field',
            description: 'Field',
          },
        ];

      default:
        return basePatterns;
    }
  }

  /**
   * Check if identifier follows the specified naming style
   */
  private followsNamingStyle(identifier: string, style: NamingRules['style'], type: string): boolean {
    // Special cases for different identifier types
    if (type === 'class' || type === 'interface' || type === 'enum') {
      // Classes, interfaces, and enums should always be PascalCase
      return this.isPascalCase(identifier);
    }

    if (type === 'constant' && identifier === identifier.toUpperCase()) {
      // Constants in UPPER_CASE are generally acceptable
      return true;
    }

    switch (style) {
      case 'camelCase':
        return this.isCamelCase(identifier);
      case 'snake_case':
        return this.isSnakeCase(identifier);
      case 'PascalCase':
        return this.isPascalCase(identifier);
      case 'kebab-case':
        return this.isKebabCase(identifier);
      default:
        return true;
    }
  }

  /**
   * Convert identifier to the specified naming style
   */
  private convertToNamingStyle(identifier: string, style: NamingRules['style']): string {
    // Split identifier into words
    const words = this.splitIdentifier(identifier);
    if (words.length === 0) return identifier;

    switch (style) {
      case 'camelCase':
        return (words[0] || '').toLowerCase() + 
               words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'snake_case':
        return words.map(w => w.toLowerCase()).join('_');
      case 'PascalCase':
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'kebab-case':
        return words.map(w => w.toLowerCase()).join('-');
      default:
        return identifier;
    }
  }

  /**
   * Split identifier into words
   */
  private splitIdentifier(identifier: string): string[] {
    // Handle camelCase and PascalCase
    const camelCaseWords = identifier.split(/(?=[A-Z])/);
    
    // Handle snake_case and kebab-case
    const result: string[] = [];
    for (const word of camelCaseWords) {
      const snakeWords = word.split(/[_-]/);
      result.push(...snakeWords.filter(w => w.length > 0));
    }

    return result.filter(w => w.length > 0);
  }

  /**
   * Check if identifier is camelCase
   */
  private isCamelCase(identifier: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(identifier);
  }

  /**
   * Check if identifier is snake_case
   */
  private isSnakeCase(identifier: string): boolean {
    return /^[a-z][a-z0-9_]*$/.test(identifier);
  }

  /**
   * Check if identifier is PascalCase
   */
  private isPascalCase(identifier: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(identifier);
  }

  /**
   * Check if identifier is kebab-case
   */
  private isKebabCase(identifier: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(identifier);
  }

  /**
   * Check for naming anti-patterns
   */
  private checkAntiPatterns(line: string, lineNumber: number, filePath: string): Issue[] {
    const issues: Issue[] = [];

    // Check for single-letter variables (except common ones like i, j, k)
    const singleLetterMatches = line.matchAll(/\b(?:var|let|const)\s+([a-hm-z])\b/g);
    for (const match of singleLetterMatches) {
      const variable = match[1];
      if (!variable || !['i', 'j', 'k', 'x', 'y', 'z'].includes(variable)) {
        issues.push({
          id: `single-letter-${filePath}-${lineNumber}-${variable || 'unknown'}`,
          type: 'naming-violation',
          severity: 'low',
          category: 'maintainability',
          title: 'Single-letter variable name',
          description: `Variable '${variable || 'unknown'}' should have a descriptive name`,
          file: filePath,
          line: lineNumber,
          suggestion: `Use a more descriptive name instead of '${variable || 'unknown'}'`,
          autoFixable: false,
        });
      }
    }

    // Check for Hungarian notation
    const hungarianMatches = line.matchAll(/\b(?:var|let|const)\s+((?:str|int|bool|arr|obj)[A-Z][a-zA-Z0-9]*)/g);
    for (const match of hungarianMatches) {
      const variable = match[1];
      if (!variable) continue;
      issues.push({
        id: `hungarian-notation-${filePath}-${lineNumber}-${variable}`,
        type: 'naming-violation',
        severity: 'low',
        category: 'maintainability',
        title: 'Hungarian notation detected',
        description: `Variable '${variable}' uses Hungarian notation which is discouraged`,
        file: filePath,
        line: lineNumber,
        suggestion: `Remove type prefix from '${variable}'`,
        autoFixable: true,
      });
    }

    // Check for overly long names (>30 characters)
    const longNameMatches = line.matchAll(/\b(?:var|let|const|function|class)\s+([a-zA-Z_$][a-zA-Z0-9_$]{30,})/g);
    for (const match of longNameMatches) {
      const identifier = match[1];
      if (!identifier) continue;
      issues.push({
        id: `long-name-${filePath}-${lineNumber}-${identifier}`,
        type: 'naming-violation',
        severity: 'low',
        category: 'maintainability',
        title: 'Overly long identifier',
        description: `Identifier '${identifier}' is too long (${identifier.length} characters)`,
        file: filePath,
        line: lineNumber,
        suggestion: `Consider shortening '${identifier}' while keeping it descriptive`,
        autoFixable: false,
      });
    }

    // Check for numbers in variable names (often indicates poor abstraction)
    const numberedMatches = line.matchAll(/\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*[0-9]+[a-zA-Z0-9_$]*)/g);
    for (const match of numberedMatches) {
      const variable = match[1];
      if (!variable || !variable.match(/^(version|v|port|timeout|max|min|limit)/i)) {
        issues.push({
          id: `numbered-variable-${filePath}-${lineNumber}-${variable || 'unknown'}`,
          type: 'naming-violation',
          severity: 'low',
          category: 'maintainability',
          title: 'Numbered variable name',
          description: `Variable '${variable || 'unknown'}' contains numbers, which may indicate poor abstraction`,
          file: filePath,
          line: lineNumber,
          suggestion: `Consider using arrays or objects instead of numbered variables`,
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  /**
   * Check if file can be analyzed for naming
   */
  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableLanguages = [
      'javascript', 'typescript', 'python', 'java', 'go', 'rust', 'php', 'ruby'
    ];
    return file.language ? analyzableLanguages.includes(file.language) : false;
  }
}
