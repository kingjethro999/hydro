/**
 * AI command - Natural language queries and intelligent suggestions
 */

import path from 'path';

import { BaseCommand } from './base';
import { AIService } from '@/ai/ai-service';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class AICommand extends BaseCommand {
  private aiService = AIService.getInstance();

  constructor() {
    super('ai', 'AI-powered natural language queries and intelligent suggestions');
    
    this.command
      .option('--query <query>', 'Ask a question about your codebase')
      .option('--suggest', 'Get intelligent suggestions for improvements')
      .option('--explain <file>', 'Explain code complexity or issues in a file')
      .option('--refactor <file>', 'Get refactoring suggestions for a file')
      .option('--analyze', 'Run comprehensive AI analysis')
      .option('--create <spec>', 'Create new code based on specification')
      .option('--read <file>', 'Read and understand code in a file')
      .option('--update <file>', 'Update code in a file')
      .option('--delete <file>', 'Analyze code for potential deletion')
      .option('--search <query>', 'Search for code using natural language')
      .option('--generate <type>', 'Generate code (function|class|component|module|test)')
      .option('--language <lang>', 'Programming language', 'typescript')
      .option('--interactive', 'Start interactive AI session', false)
      .option('--bulk', 'Process multiple operations in bulk', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      query?: string;
      suggest?: boolean;
      explain?: string;
      refactor?: string;
      analyze?: boolean;
      create?: string;
      read?: string;
      update?: string;
      delete?: string;
      search?: string;
      generate?: string;
      language?: string;
      interactive?: boolean;
      bulk?: boolean;
    }
  ): Promise<void> {
    // Initialize AI service
    await this.aiService.initialize();

    if (!this.aiService.isAIServiceEnabled()) {
      logger.warn('AI service is not available. Running in fallback mode.');
      logger.info('This could be due to:');
      logger.info('• No internet connection - Please check your network and try again');
      logger.info('• API key not configured - Please set your OpenRouter API key');
      logger.info('• API service unavailable - Please try again later');
      logger.info('');
    }

    if (options.interactive) {
      await this.startInteractiveSession();
    } else if (options.query) {
      await this.processQuery(options.query);
    } else if (options.suggest) {
      await this.generateSuggestions();
    } else if (options.explain) {
      await this.explainFile(options.explain);
    } else if (options.refactor) {
      await this.refactorFile(options.refactor);
    } else if (options.analyze) {
      await this.runAnalysis();
    } else if (options.create) {
      await this.createCode(options.create, options.language || 'typescript');
    } else if (options.read) {
      await this.readCode(options.read);
    } else if (options.update) {
      await this.updateCode(options.update);
    } else if (options.delete) {
      await this.deleteCode(options.delete);
    } else if (options.search) {
      await this.searchCode(options.search);
    } else if (options.generate) {
      await this.generateCode(options.generate, options.language || 'typescript');
    } else {
      this.showHelp();
    }
  }

  /**
   * Process a natural language query
   */
  private async processQuery(query: string): Promise<void> {
    const spinner = logger.createSpinner('Processing your query...');
    spinner.start();

    try {
      // Get codebase context for better AI responses
      const context = await this.getCodebaseContext();
      
      const response = await this.aiService.processQuery({
        query,
        context,
        type: 'analysis'
      });

      spinner.succeed('Query processed');

      logger.raw('\n🤖 AI Response:');
      logger.raw('─'.repeat(15));
      logger.raw(response.answer);

      if (response.suggestions && response.suggestions.length > 0) {
        logger.raw('\n💡 Suggestions:');
        response.suggestions.forEach((suggestion, index) => {
          logger.raw(`  ${index + 1}. ${suggestion}`);
        });
      }

      if (response.codeExamples && response.codeExamples.length > 0) {
        logger.raw('\n📝 Code Examples:');
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}:`);
          logger.raw(`\`\`\`${example.language}`);
          logger.raw(example.code);
          logger.raw('```');
        });
      }

      if (response.relatedFiles && response.relatedFiles.length > 0) {
        logger.raw('\n📁 Related Files:');
        response.relatedFiles.forEach(file => {
          logger.raw(`  • ${file}`);
        });
      }

      logger.raw(`\nConfidence: ${Math.round(response.confidence * 100)}%`);

    } catch (error) {
      spinner.fail('Query processing failed');
      throw error;
    }
  }

  /**
   * Generate intelligent suggestions
   */
  private async generateSuggestions(): Promise<void> {
    const spinner = logger.createSpinner('Analyzing codebase for suggestions...');
    spinner.start();

    try {
      // Analyze the actual codebase
      const { FileScanner } = await import('@/core/file-scanner');
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      
      const fileScanner = new FileScanner();
      const complexityAnalyzer = new ComplexityAnalyzer();
      
      // Scan the current directory for files
      const scanResult = await fileScanner.scanFiles(process.cwd(), {
        include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java', '**/*.go'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
        maxFileSize: 1024 * 1024 // 1MB
      });

      // Calculate complexity metrics
      const metrics = await complexityAnalyzer.calculateMetrics(scanResult.files);
      
      // Create codebase context
      const codebase = {
        files: scanResult.files,
        metrics,
        totalFiles: scanResult.totalFiles,
        languages: Array.from(scanResult.languages)
      };

      const suggestions = await this.aiService.generateSuggestions(codebase, 'general');

      spinner.succeed('Suggestions generated');

      logger.raw('\n🎯 Intelligent Suggestions:');
      logger.raw('─'.repeat(25));
      logger.raw(`Analyzed ${scanResult.totalFiles} files in ${scanResult.languages.size} languages`);
      logger.raw(`Average function length: ${metrics.averageFunctionLength} lines`);
      logger.raw(`Average complexity: ${metrics.cyclomaticComplexity}`);
      logger.raw('');

      suggestions.forEach((suggestion, index) => {
        const priorityIcon = this.getPriorityIcon(suggestion.priority);
        const effortIcon = this.getEffortIcon(suggestion.effort);
        
        logger.raw(`\n${index + 1}. ${priorityIcon} ${suggestion.title}`);
        logger.raw(`   Type: ${suggestion.type}`);
        logger.raw(`   ${suggestion.description}`);
        logger.raw(`   Impact: ${suggestion.impact}`);
        logger.raw(`   Effort: ${effortIcon} ${suggestion.effort}`);
        
        if (suggestion.codeExample) {
          logger.raw(`   Example: ${suggestion.codeExample}`);
        }
        
        if (suggestion.relatedFiles.length > 0) {
          logger.raw(`   Files: ${suggestion.relatedFiles.join(', ')}`);
        }
      });

    } catch (error) {
      spinner.fail('Suggestion generation failed');
      throw error;
    }
  }

  /**
   * Explain code in a file
   */
  private async explainFile(filePath: string): Promise<void> {
    const spinner = logger.createSpinner(`Explaining code in ${filePath}...`);
    spinner.start();

    try {
      // Read and analyze the actual file
      const { FileScanner } = await import('@/core/file-scanner');
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      
      const fileScanner = new FileScanner();
      const complexityAnalyzer = new ComplexityAnalyzer();
      
      // Check if file exists
      const fs = await import('fs-extra');
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const content = await fileScanner.readFileContent(filePath);
      const lines = content.split('\n');
      
      // Create file info for analysis
      const fileInfo = {
        path: filePath,
        relativePath: filePath,
        size: content.length,
        extension: path.extname(filePath),
        language: this.getLanguageFromExtension(path.extname(filePath)),
        lastModified: new Date()
      };

      // Calculate actual complexity metrics
      const functions = this.extractFunctions(content, fileInfo.language || 'javascript');
      const totalComplexity = functions.reduce((sum, func) => {
        return sum + this.calculateCyclomaticComplexity(func.body);
      }, 0);
      
      const avgComplexity = functions.length > 0 ? Math.round(totalComplexity / functions.length) : 1;
      const maxComplexity = functions.length > 0 ? Math.max(...functions.map(f => this.calculateCyclomaticComplexity(f.body))) : 1;

      const metrics = {
        lines: lines.length,
        functions: functions.length,
        complexity: avgComplexity,
        maxComplexity,
        fileType: fileInfo.language || 'unknown'
      };

      // Generate AI explanation based on actual file content
      const response = await this.aiService.explainComplexity(content, metrics);

      spinner.succeed('Code explanation generated');

      logger.raw(`\n📖 Code Explanation for ${filePath}:`);
      logger.raw('─'.repeat(35));
      logger.raw(`File: ${filePath}`);
      logger.raw(`Lines: ${metrics.lines} | Functions: ${metrics.functions} | Avg Complexity: ${metrics.complexity}`);
      logger.raw('');
      logger.raw(response.answer);

      if (response.codeExamples && response.codeExamples.length > 0) {
        logger.raw('\n💡 Examples:');
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}:`);
          logger.raw(`\`\`\`${example.language}`);
          logger.raw(example.code);
          logger.raw('```');
        });
      }

    } catch (error) {
      spinner.fail('Code explanation failed');
      throw error;
    }
  }

  /**
   * Get refactoring suggestions for a file
   */
  private async refactorFile(filePath: string): Promise<void> {
    const spinner = logger.createSpinner(`Analyzing ${filePath} for refactoring...`);
    spinner.start();

    try {
      // Read and analyze the actual file
      const { FileScanner } = await import('@/core/file-scanner');
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      
      const fileScanner = new FileScanner();
      const complexityAnalyzer = new ComplexityAnalyzer();
      
      // Check if file exists
      const fs = await import('fs-extra');
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Read file content
      const content = await fileScanner.readFileContent(filePath);
      
      // Create file info for analysis
      const fileInfo = {
        path: filePath,
        relativePath: filePath,
        size: content.length,
        extension: path.extname(filePath),
        language: this.getLanguageFromExtension(path.extname(filePath)),
        lastModified: new Date()
      };

      // Analyze for issues using the complexity analyzer
      const rules = {
        maxFunctionLines: 50,
        maxParameterCount: 5,
        maxCyclomaticComplexity: 10
      };
      
      const issues = await complexityAnalyzer.analyze([fileInfo], rules);

      // Generate AI refactoring suggestions based on actual issues
      const response = await this.aiService.suggestRefactoring(content, issues);

      spinner.succeed('Refactoring suggestions generated');

      logger.raw(`\n🔧 Refactoring Suggestions for ${filePath}:`);
      logger.raw('─'.repeat(40));
      logger.raw(`File: ${filePath}`);
      logger.raw(`Issues found: ${issues.length}`);
      logger.raw('');
      logger.raw(response.answer);

      if (issues.length > 0) {
        logger.raw('\n🔍 Issues Detected:');
        issues.forEach((issue, index) => {
          const severityIcon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
          logger.raw(`  ${index + 1}. ${severityIcon} ${issue.title} (Line ${issue.line || 'N/A'})`);
          logger.raw(`     ${issue.description}`);
        });
      }

      if (response.suggestions && response.suggestions.length > 0) {
        logger.raw('\n📋 Action Items:');
        response.suggestions.forEach((suggestion, index) => {
          logger.raw(`  ${index + 1}. ${suggestion}`);
        });
      }

      if (response.codeExamples && response.codeExamples.length > 0) {
        logger.raw('\n💻 Code Examples:');
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}:`);
          logger.raw(`\`\`\`${example.language}`);
          logger.raw(example.code);
          logger.raw('```');
        });
      }

    } catch (error) {
      spinner.fail('Refactoring analysis failed');
      throw error;
    }
  }

  /**
   * Run comprehensive AI analysis
   */
  private async runAnalysis(): Promise<void> {
    const spinner = logger.createSpinner('Running comprehensive AI analysis...');
    spinner.start();

    try {
      // Run a full analysis of the actual codebase
      const { FileScanner } = await import('@/core/file-scanner');
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      
      const fileScanner = new FileScanner();
      const complexityAnalyzer = new ComplexityAnalyzer();
      
      // Scan the current directory for files
      const scanResult = await fileScanner.scanFiles(process.cwd(), {
        include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.py', '**/*.java', '**/*.go'],
        exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
        maxFileSize: 1024 * 1024 // 1MB
      });

      // Calculate complexity metrics
      const metrics = await complexityAnalyzer.calculateMetrics(scanResult.files);
      
      // Create codebase context
      const codebase = {
        files: scanResult.files,
        metrics,
        totalFiles: scanResult.totalFiles,
        languages: Array.from(scanResult.languages)
      };

      const suggestions = await this.aiService.generateSuggestions(codebase, 'comprehensive');

      spinner.succeed('AI analysis complete');

      logger.raw('\n🔍 Comprehensive AI Analysis:');
      logger.raw('─'.repeat(30));
      logger.raw(`Analyzed ${scanResult.totalFiles} files in ${scanResult.languages.size} languages`);
      logger.raw(`Languages: ${Array.from(scanResult.languages).join(', ')}`);
      logger.raw(`Average function length: ${metrics.averageFunctionLength} lines`);
      logger.raw(`Average complexity: ${metrics.cyclomaticComplexity}`);
      logger.raw(`Max nesting depth: ${metrics.nestingDepth}`);
      logger.raw('');

      // Group suggestions by type
      const groupedSuggestions = suggestions.reduce((groups, suggestion) => {
        if (!groups[suggestion.type]) {
          groups[suggestion.type] = [];
        }
        const typeGroup = groups[suggestion.type];
        if (typeGroup) {
          typeGroup.push(suggestion);
        }
        return groups;
      }, {} as Record<string, typeof suggestions>);

      Object.entries(groupedSuggestions).forEach(([type, typeSuggestions]) => {
        if (typeSuggestions) {
          logger.raw(`\n📊 ${type.toUpperCase()} (${typeSuggestions.length} suggestions):`);
          typeSuggestions.forEach((suggestion, index) => {
            const priorityIcon = this.getPriorityIcon(suggestion.priority);
            logger.raw(`  ${index + 1}. ${priorityIcon} ${suggestion.title}`);
          });
        }
      });

      logger.raw('\n💡 Next Steps:');
      logger.raw('  1. Review high-priority suggestions first');
      logger.raw('  2. Consider effort vs impact when planning work');
      logger.raw('  3. Use "hydro ai --explain <file>" for detailed explanations');
      logger.raw('  4. Use "hydro ai --refactor <file>" for specific refactoring help');

    } catch (error) {
      spinner.fail('AI analysis failed');
      throw error;
    }
  }

  /**
   * Start interactive AI session
   */
  private async startInteractiveSession(): Promise<void> {
    logger.info('Starting interactive AI session...');
    logger.info('Type "exit" to quit, "help" for commands');

    // This would normally use a readline interface
    // For now, we'll show a message
    logger.raw('\n🤖 Interactive AI Session');
    logger.raw('─'.repeat(25));
    logger.raw('Interactive mode is coming soon!');
    logger.raw('For now, use specific commands:');
    logger.raw('  hydro ai --query "your question"');
    logger.raw('  hydro ai --suggest');
    logger.raw('  hydro ai --explain <file>');
    logger.raw('  hydro ai --refactor <file>');
  }

  /**
   * Get priority icon
   */
  private getPriorityIcon(priority: string): string {
    const icons = {
      low: '🟢',
      medium: '🟡',
      high: '🟠',
      critical: '🔴'
    };
    return icons[priority as keyof typeof icons] || '⚪';
  }

  /**
   * Get effort icon
   */
  private getEffortIcon(effort: string): string {
    const icons = {
      low: '⚡',
      medium: '🔧',
      high: '🏗️'
    };
    return icons[effort as keyof typeof icons] || '⚪';
  }

  /**
   * Show help for AI command
   */
  private showHelp(): void {
    logger.raw('\n🤖 Hydro AI Assistant');
    logger.raw('─'.repeat(20));
    logger.raw('');
    logger.raw('AI-powered analysis and suggestions for your codebase.');
    logger.raw('');
    logger.raw('Commands:');
    logger.raw('  --query <question>     Ask a question about your code');
    logger.raw('  --suggest             Get intelligent improvement suggestions');
    logger.raw('  --explain <file>      Explain code complexity in a file');
    logger.raw('  --refactor <file>     Get refactoring suggestions for a file');
    logger.raw('  --analyze             Run comprehensive AI analysis');
    logger.raw('  --interactive         Start interactive AI session');
    logger.raw('');
    logger.raw('Examples:');
    logger.raw('  hydro ai --query "How can I improve performance?"');
    logger.raw('  hydro ai --suggest');
    logger.raw('  hydro ai --explain src/components/Button.tsx');
    logger.raw('  hydro ai --refactor src/utils/helpers.js');
    logger.raw('  hydro ai --analyze');
  }

  /**
   * Get codebase context for AI queries
   */
  private async getCodebaseContext(): Promise<string> {
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const context: string[] = [];
      
      // Get package.json info
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        context.push(`Project: ${packageJson.name || 'Unknown'}`);
        context.push(`Version: ${packageJson.version || 'Unknown'}`);
        context.push(`Dependencies: ${Object.keys(packageJson.dependencies || {}).join(', ')}`);
      }
      
      // Get TypeScript config
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      if (await fs.pathExists(tsconfigPath)) {
        context.push('TypeScript project detected');
      }
      
      // Get Next.js config
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      if (await fs.pathExists(nextConfigPath)) {
        context.push('Next.js project detected');
      }
      
      // Get React config
      const reactConfigPath = path.join(process.cwd(), 'src');
      if (await fs.pathExists(reactConfigPath)) {
        context.push('React project with src directory');
      }
      
      return context.join('\n');
      
    } catch (error) {
      logger.debug('Failed to get codebase context:', { error: (error as Error).message });
      return 'Codebase context unavailable';
    }
  }

  /**
   * Get language from file extension
   */
  private getLanguageFromExtension(extension: string): string {
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.mjs': 'javascript',
      '.cjs': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp'
    };
    return languageMap[extension] || 'unknown';
  }

  /**
   * Extract functions from code content (simplified version)
   */
  private extractFunctions(content: string, language: string): Array<{ name: string; body: string; startLine: number; endLine: number; lineCount: number; parameterCount: number }> {
    const functions: Array<{ name: string; body: string; startLine: number; endLine: number; lineCount: number; parameterCount: number }> = [];
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
   * Create new code using AI
   */
  private async createCode(specification: string, language: string): Promise<void> {
    const spinner = logger.createSpinner('Creating code with AI...');
    spinner.start();

    try {
      const response = await this.aiService.createCode(
        specification,
        `generated-${Date.now()}`,
        language
      );

      spinner.succeed('Code created successfully');

      logger.raw('\n📝 Generated Code:');
      logger.raw('─'.repeat(20));
      logger.raw(response.answer);

      if (response.codeExamples && response.codeExamples.length > 0) {
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}`);
          logger.raw(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
        });
      }

    } catch (error) {
      spinner.fail('Code creation failed');
      throw error;
    }
  }

  /**
   * Read and understand code using AI
   */
  private async readCode(filePath: string): Promise<void> {
    const spinner = logger.createSpinner('Reading and analyzing code...');
    spinner.start();

    try {
      const fs = await import('fs/promises');
      const code = await fs.readFile(filePath, 'utf-8');

      const response = await this.aiService.readCode(filePath, code);

      spinner.succeed('Code analysis complete');

      logger.raw('\n📖 Code Analysis:');
      logger.raw('─'.repeat(20));
      logger.raw(response.answer);

      if (response.suggestions && response.suggestions.length > 0) {
        logger.raw('\n💡 Suggestions:');
        response.suggestions.forEach((suggestion, index) => {
          logger.raw(`  ${index + 1}. ${suggestion}`);
        });
      }

    } catch (error) {
      spinner.fail('Code reading failed');
      throw error;
    }
  }

  /**
   * Update code using AI
   */
  private async updateCode(filePath: string): Promise<void> {
    const spinner = logger.createSpinner('Updating code with AI...');
    spinner.start();

    try {
      const fs = await import('fs/promises');
      const originalCode = await fs.readFile(filePath, 'utf-8');

      // For now, use a generic update request
      const updateRequest = 'Improve code quality, add error handling, and optimize performance';

      const response = await this.aiService.updateCode(originalCode, updateRequest, filePath);

      spinner.succeed('Code update complete');

      logger.raw('\n📝 Update Suggestions:');
      logger.raw('─'.repeat(25));
      logger.raw(response.answer);

      if (response.codeExamples && response.codeExamples.length > 0) {
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}`);
          logger.raw(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
        });
      }

    } catch (error) {
      spinner.fail('Code update failed');
      throw error;
    }
  }

  /**
   * Analyze code for potential deletion
   */
  private async deleteCode(filePath: string): Promise<void> {
    const spinner = logger.createSpinner('Analyzing code for deletion...');
    spinner.start();

    try {
      const fs = await import('fs/promises');
      const code = await fs.readFile(filePath, 'utf-8');

      const response = await this.aiService.deleteCode(code, filePath);

      spinner.succeed('Deletion analysis complete');

      logger.raw('\n🗑️  Deletion Analysis:');
      logger.raw('─'.repeat(25));
      logger.raw(response.answer);

      if (response.confidence > 0.7) {
        logger.warn('⚠️  High confidence that this code may be safe to delete');
      } else if (response.confidence < 0.3) {
        logger.info('✅ Low confidence - code appears to be in use');
      } else {
        logger.info('⚠️  Medium confidence - review carefully before deletion');
      }

    } catch (error) {
      spinner.fail('Deletion analysis failed');
      throw error;
    }
  }

  /**
   * Search for code using natural language
   */
  private async searchCode(query: string): Promise<void> {
    const spinner = logger.createSpinner('Searching code with AI...');
    spinner.start();

    try {
      // Get basic codebase info
      const codebaseInfo = {
        totalFiles: 100, // Simplified
        languages: ['typescript', 'javascript'],
        metrics: {}
      };

      const response = await this.aiService.searchCode(query, codebaseInfo);

      spinner.succeed('Code search complete');

      logger.raw('\n🔍 Search Results:');
      logger.raw('─'.repeat(20));
      logger.raw(response.answer);

      if (response.relatedFiles && response.relatedFiles.length > 0) {
        logger.raw('\n📁 Related Files:');
        response.relatedFiles.forEach((file, index) => {
          logger.raw(`  ${index + 1}. ${file}`);
        });
      }

    } catch (error) {
      spinner.fail('Code search failed');
      throw error;
    }
  }

  /**
   * Generate code using AI
   */
  private async generateCode(type: string, language: string): Promise<void> {
    const spinner = logger.createSpinner('Generating code with AI...');
    spinner.start();

    try {
      const requirements = `Generate a ${type} in ${language} with proper error handling and documentation`;

      const response = await this.aiService.generateCode({
        type: type as any,
        language,
        requirements
      });

      spinner.succeed('Code generation complete');

      logger.raw('\n📝 Generated Code:');
      logger.raw('─'.repeat(20));
      logger.raw(response.answer);

      if (response.codeExamples && response.codeExamples.length > 0) {
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}`);
          logger.raw(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
        });
      }

    } catch (error) {
      spinner.fail('Code generation failed');
      throw error;
    }
  }
}
