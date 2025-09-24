/**
 * AI-powered CRUD operations command
 */

import fs from 'fs/promises';
import path from 'path';

import { BaseCommand } from './base';
import { AIService } from '@/ai/ai-service';
import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { CommandOptions, HydroConfig } from '@/types';
import type { CRUDOperation, CodeGenerationRequest } from '@/ai/ai-service';

export class CrudCommand extends BaseCommand {
  private aiService = AIService.getInstance();
  private fileScanner = new FileScanner();

  constructor() {
    super('crud', 'AI-powered CRUD operations for code');
    
    this.command
      .option('--create <spec>', 'Create new code based on specification')
      .option('--read <file>', 'Read and understand code in a file')
      .option('--update <file>', 'Update code in a file')
      .option('--delete <file>', 'Analyze code for potential deletion')
      .option('--search <query>', 'Search for code using natural language')
      .option('--generate <type>', 'Generate code (function|class|component|module|test)')
      .option('--language <lang>', 'Programming language (typescript|javascript|python|etc)', 'typescript')
      .option('--interactive', 'Start interactive CRUD session', false)
      .option('--bulk', 'Process multiple files in bulk', false)
      .option('--dry-run', 'Show what would be done without making changes', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      create?: string;
      read?: string;
      update?: string;
      delete?: string;
      search?: string;
      generate?: string;
      language?: string;
      interactive?: boolean;
      bulk?: boolean;
      dryRun?: boolean;
    }
  ): Promise<void> {
    // Initialize AI service
    await this.aiService.initialize();

    if (!this.aiService.isAIServiceEnabled()) {
      logger.warn('AI service is not available. CRUD operations will be limited.');
      return;
    }

    const config = await this.loadConfig();
    const targetPath = this.getTargetPath(options);

    if (options.interactive) {
      await this.startInteractiveSession(targetPath, config);
    } else if (options.create) {
      await this.createCode(options.create, options.language || 'typescript', targetPath, options.dryRun);
    } else if (options.read) {
      await this.readCode(options.read, targetPath);
    } else if (options.update) {
      await this.updateCode(options.update, targetPath, options.dryRun);
    } else if (options.delete) {
      await this.deleteCode(options.delete, targetPath, options.dryRun);
    } else if (options.search) {
      await this.searchCode(options.search, targetPath);
    } else if (options.generate) {
      await this.generateCode(options.generate, options.language || 'typescript', targetPath, options.dryRun);
    } else {
      this.showInteractiveHelp();
    }
  }

  /**
   * Create new code using AI
   */
  private async createCode(
    specification: string,
    language: string,
    targetPath: string,
    dryRun: boolean = false
  ): Promise<void> {
    const spinner = logger.createSpinner('Creating code with AI...');
    spinner.start();

    try {
      const fileName = this.generateFileName(specification, language);
      const filePath = path.join(targetPath, fileName);

      if (!dryRun && await this.fileExists(filePath)) {
        spinner.fail(`File ${fileName} already exists`);
        return;
      }

      const response = await this.aiService.createCode(
        specification,
        filePath,
        language,
        await this.getExistingPatterns(targetPath, language)
      );

      spinner.succeed('Code created successfully');

      if (dryRun) {
        logger.info('Dry run - would create:');
        logger.raw(`\nFile: ${fileName}`);
        logger.raw(`\nCode:\n${this.extractCodeFromResponse(response)}`);
      } else {
        await fs.writeFile(filePath, this.extractCodeFromResponse(response), 'utf-8');
        logger.success(`Created: ${fileName}`);
      }

      // Show suggestions if any
      if (response.suggestions && response.suggestions.length > 0) {
        logger.info('\n💡 Suggestions:');
        response.suggestions.forEach((suggestion, index) => {
          logger.raw(`  ${index + 1}. ${suggestion}`);
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
  private async readCode(filePath: string, targetPath: string): Promise<void> {
    const spinner = logger.createSpinner('Reading and analyzing code...');
    spinner.start();

    try {
      const fullPath = path.resolve(targetPath, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const response = await this.aiService.readCode(fullPath, code);

      spinner.succeed('Code analysis complete');

      logger.raw('\n📖 Code Analysis:');
      logger.raw('─'.repeat(20));
      logger.raw(response.answer);

      if (response.codeExamples && response.codeExamples.length > 0) {
        logger.raw('\n📝 Related Examples:');
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}`);
          logger.raw(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
        });
      }

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
  private async updateCode(
    filePath: string,
    targetPath: string,
    dryRun: boolean = false
  ): Promise<void> {
    const spinner = logger.createSpinner('Updating code with AI...');
    spinner.start();

    try {
      const fullPath = path.resolve(targetPath, filePath);
      const originalCode = await fs.readFile(fullPath, 'utf-8');

      // Get update request from user
      const updateRequest = await this.getUserInput('What changes would you like to make? ');

      const response = await this.aiService.updateCode(originalCode, updateRequest, fullPath);

      spinner.succeed('Code update complete');

      const updatedCode = this.extractCodeFromResponse(response);

      if (dryRun) {
        logger.info('Dry run - would update:');
        logger.raw(`\nFile: ${filePath}`);
        logger.raw(`\nUpdated Code:\n${updatedCode}`);
      } else {
        await fs.writeFile(fullPath, updatedCode, 'utf-8');
        logger.success(`Updated: ${filePath}`);
      }

      // Show changes summary
      logger.raw('\n📝 Update Summary:');
      logger.raw(response.answer);

    } catch (error) {
      spinner.fail('Code update failed');
      throw error;
    }
  }

  /**
   * Analyze code for potential deletion
   */
  private async deleteCode(
    filePath: string,
    targetPath: string,
    dryRun: boolean = false
  ): Promise<void> {
    const spinner = logger.createSpinner('Analyzing code for deletion...');
    spinner.start();

    try {
      const fullPath = path.resolve(targetPath, filePath);
      const code = await fs.readFile(fullPath, 'utf-8');

      const reason = await this.getUserInput('Reason for deletion (optional): ');

      const response = await this.aiService.deleteCode(code, fullPath, reason);

      spinner.succeed('Deletion analysis complete');

      logger.raw('\n🗑️  Deletion Analysis:');
      logger.raw('─'.repeat(25));
      logger.raw(response.answer);

      if (response.confidence > 0.7) {
        const confirm = await this.getUserInput('\nDo you want to delete this file? (y/N): ');
        if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
          if (!dryRun) {
            await fs.unlink(fullPath);
            logger.success(`Deleted: ${filePath}`);
          } else {
            logger.info(`Dry run - would delete: ${filePath}`);
          }
        }
      }

    } catch (error) {
      spinner.fail('Deletion analysis failed');
      throw error;
    }
  }

  /**
   * Search for code using natural language
   */
  private async searchCode(query: string, targetPath: string): Promise<void> {
    const spinner = logger.createSpinner('Searching code with AI...');
    spinner.start();

    try {
      // Get codebase info for context
      const codebase = await this.getCodebaseInfo(targetPath);

      const response = await this.aiService.searchCode(query, codebase);

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

      if (response.codeExamples && response.codeExamples.length > 0) {
        logger.raw('\n📝 Code Examples:');
        response.codeExamples.forEach((example, index) => {
          logger.raw(`\n${index + 1}. ${example.description}`);
          logger.raw(`\`\`\`${example.language}\n${example.code}\n\`\`\``);
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
  private async generateCode(
    type: string,
    language: string,
    targetPath: string,
    dryRun: boolean = false
  ): Promise<void> {
    const spinner = logger.createSpinner('Generating code with AI...');
    spinner.start();

    try {
      const requirements = await this.getUserInput('Describe what you want to generate: ');

      const request: CodeGenerationRequest = {
        type: type as any,
        language,
        requirements,
        existingCode: await this.getExistingPatterns(targetPath, language).then(p => p.join('\n')),
        patterns: await this.getExistingPatterns(targetPath, language)
      };

      const response = await this.aiService.generateCode(request);

      spinner.succeed('Code generation complete');

      const fileName = this.generateFileName(requirements, language);
      const generatedCode = this.extractCodeFromResponse(response);

      if (dryRun) {
        logger.info('Dry run - would generate:');
        logger.raw(`\nFile: ${fileName}`);
        logger.raw(`\nGenerated Code:\n${generatedCode}`);
      } else {
        const filePath = path.join(targetPath, fileName);
        await fs.writeFile(filePath, generatedCode, 'utf-8');
        logger.success(`Generated: ${fileName}`);
      }

      // Show suggestions
      if (response.suggestions && response.suggestions.length > 0) {
        logger.raw('\n💡 Suggestions:');
        response.suggestions.forEach((suggestion, index) => {
          logger.raw(`  ${index + 1}. ${suggestion}`);
        });
      }

    } catch (error) {
      spinner.fail('Code generation failed');
      throw error;
    }
  }

  /**
   * Start interactive CRUD session
   */
  private async startInteractiveSession(targetPath: string, config: HydroConfig): Promise<void> {
    logger.info('🤖 Starting Interactive AI CRUD Session');
    logger.info('Type "help" for commands, "exit" to quit');

    while (true) {
      try {
        const input = await this.getUserInput('\ncrud> ');
        const [command, ...args] = input.trim().split(' ');

        switch (command?.toLowerCase()) {
          case 'help':
            this.showInteractiveHelp();
            break;
          case 'exit':
          case 'quit':
            logger.info('Goodbye!');
            return;
          case 'create':
            if (args.length > 0) {
              await this.createCode(args.join(' '), 'typescript', targetPath, false);
            } else {
              logger.error('Usage: create <specification>');
            }
            break;
          case 'read':
            if (args.length > 0) {
              await this.readCode(args[0]!, targetPath);
            } else {
              logger.error('Usage: read <file>');
            }
            break;
          case 'search':
            if (args.length > 0) {
              await this.searchCode(args.join(' ')!, targetPath);
            } else {
              logger.error('Usage: search <query>');
            }
            break;
          case 'generate':
            if (args.length > 1) {
              await this.generateCode(args[0]!, args[1]! || 'typescript', targetPath, false);
            } else {
              logger.error('Usage: generate <type> <language>');
            }
            break;
          default:
            logger.error(`Unknown command: ${command}. Type "help" for available commands.`);
        }
      } catch (error) {
        logger.error('Interactive command failed:', error as Error);
      }
    }
  }

  /**
   * Show interactive help
   */
  private showInteractiveHelp(): void {
    logger.raw('\n🤖 AI CRUD Commands:');
    logger.raw('─'.repeat(25));
    logger.raw('create <spec>     - Create new code from specification');
    logger.raw('read <file>       - Read and understand code');
    logger.raw('search <query>    - Search for code using natural language');
    logger.raw('generate <type> <lang> - Generate code of specific type');
    logger.raw('help              - Show this help');
    logger.raw('exit              - Exit interactive mode');
    logger.raw('\nExamples:');
    logger.raw('  create "React component for user profile"');
    logger.raw('  read src/components/UserProfile.tsx');
    logger.raw('  search "authentication logic"');
    logger.raw('  generate function typescript');
  }

  /**
   * Helper methods
   */
  private generateFileName(specification: string, language: string): string {
    const baseName = specification
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    const extensions: Record<string, string> = {
      typescript: '.ts',
      javascript: '.js',
      python: '.py',
      java: '.java',
      cpp: '.cpp',
      c: '.c',
      html: '.html',
      css: '.css',
      json: '.json'
    };

    return `${baseName}${extensions[language] || '.txt'}`;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async getExistingPatterns(targetPath: string, language: string): Promise<string[]> {
    try {
      const files = await this.fileScanner.scanFiles(targetPath, { 
        include: [`**/*.${language === 'typescript' ? 'ts' : language}`],
        exclude: ['node_modules/**', 'dist/**']
      });
      
      return files.files.slice(0, 5).map(f => f.path);
    } catch {
      return [];
    }
  }

  private async getCodebaseInfo(targetPath: string): Promise<any> {
    try {
      const scanResult = await this.fileScanner.scanFiles(targetPath, {
        include: ['**/*'],
        exclude: ['node_modules/**', 'dist/**']
      });
      
      return {
        totalFiles: scanResult.totalFiles,
        languages: ['typescript', 'javascript', 'json'],
        metrics: {
          averageFunctionLength: 15,
          cyclomaticComplexity: 3.2,
          nestingDepth: 2
        }
      };
    } catch {
      return {
        totalFiles: 0,
        languages: [],
        metrics: {}
      };
    }
  }

  private extractCodeFromResponse(response: any): string {
    // Try to extract code from code examples first
    if (response.codeExamples && response.codeExamples.length > 0) {
      return response.codeExamples[0].code;
    }
    
    // Try to extract code from answer
    const codeMatch = response.answer.match(/```[\s\S]*?```/);
    if (codeMatch) {
      return codeMatch[0].replace(/```\w*\n?/, '').replace(/```$/, '').trim();
    }
    
    // Return the answer as-is if no code found
    return response.answer;
  }

  private async getUserInput(prompt: string): Promise<string> {
    // This is a simplified implementation
    // In a real CLI, you'd use a proper input library
    return new Promise((resolve) => {
      process.stdout.write(prompt);
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim());
      });
    });
  }
}
