/**
 * Generate command - Generate code, tests, and documentation
 */

import { BaseCommand } from './base';
import { CodeGenerator } from '@/generators/code-generator';
import { logger } from '@/core/logger';

import type { CommandOptions, GenerationOptions } from '@/types';

export class GenerateCommand extends BaseCommand {
  constructor() {
    super('generate', 'Generate code, tests, and documentation');
    
    this.command
      .option('--component <name>', 'Generate React component')
      .option('--service <name>', 'Generate service class')
      .option('--api-client <name>', 'Generate API client')
      .option('--tests', 'Generate test files for existing code')
      .option('--language <lang>', 'Programming language (javascript|typescript|python|java|go|rust)', 'typescript')
      .option('--framework <framework>', 'Framework (react|vue|angular|express|fastify)', 'react')
      .option('--style <style>', 'Code style (functional|class|hooks)', 'functional')
      .option('--include-types', 'Include TypeScript types', false)
      .option('--include-tests', 'Include test files', true)
      .option('--include-docs', 'Include documentation', false)
      .option('--output <path>', 'Output directory', 'src')
      .option('--base-url <url>', 'Base URL for API client', 'https://api.example.com')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      component?: string;
      service?: string;
      apiClient?: string;
      tests?: boolean;
      language?: string;
      framework?: string;
      style?: string;
      includeTypes?: boolean;
      includeTests?: boolean;
      includeDocs?: boolean;
      output?: string;
      baseUrl?: string;
    }
  ): Promise<void> {
    const config = await this.loadConfig();
    const generator = new CodeGenerator();

    const generationOptions: GenerationOptions = {
      language: options.language as any || 'typescript',
      framework: options.framework || 'react',
      style: options.style as any || 'functional',
      includeTests: options.includeTests ?? true,
      includeTypes: options.includeTypes ?? false,
      includeDocs: options.includeDocs ?? false,
      outputDir: options.output || 'src',
    };

    try {
      if (options.component) {
        await this.generateComponent(generator, options.component, generationOptions);
      } else if (options.service) {
        await this.generateService(generator, options.service, generationOptions);
      } else if (options.apiClient) {
        await this.generateApiClient(generator, options.apiClient, options.baseUrl || 'https://api.example.com', generationOptions);
      } else if (options.tests) {
        await this.generateTests(generator, config, generationOptions);
      } else {
        this.showHelp();
      }
    } catch (error) {
      logger.error('Generation failed', error as Error);
      throw error;
    }
  }

  /**
   * Generate React component
   */
  private async generateComponent(
    generator: CodeGenerator,
    name: string,
    options: GenerationOptions
  ): Promise<void> {
    const spinner = logger.createSpinner(`Generating React component: ${name}...`);
    spinner.start();

    try {
      const files = await generator.generateReactComponent(name, options);
      spinner.succeed(`Generated React component: ${name}`);
      
      logger.raw('\n📁 Generated files:');
      files.forEach(file => {
        logger.raw(`  • ${file}`);
      });

      logger.raw('\n💡 Next steps:');
      logger.raw(`  1. Import and use the component in your app`);
      logger.raw(`  2. Customize the component props and styling`);
      logger.raw(`  3. Add tests and documentation as needed`);

    } catch (error) {
      spinner.fail('Component generation failed');
      throw error;
    }
  }

  /**
   * Generate service
   */
  private async generateService(
    generator: CodeGenerator,
    name: string,
    options: GenerationOptions
  ): Promise<void> {
    const spinner = logger.createSpinner(`Generating service: ${name}...`);
    spinner.start();

    try {
      const files = await generator.generateService(name, options);
      spinner.succeed(`Generated service: ${name}`);
      
      logger.raw('\n📁 Generated files:');
      files.forEach(file => {
        logger.raw(`  • ${file}`);
      });

      logger.raw('\n💡 Next steps:');
      logger.raw(`  1. Implement your service methods`);
      logger.raw(`  2. Add configuration and error handling`);
      logger.raw(`  3. Write tests for your service logic`);

    } catch (error) {
      spinner.fail('Service generation failed');
      throw error;
    }
  }

  /**
   * Generate API client
   */
  private async generateApiClient(
    generator: CodeGenerator,
    name: string,
    baseUrl: string,
    options: GenerationOptions
  ): Promise<void> {
    const spinner = logger.createSpinner(`Generating API client: ${name}...`);
    spinner.start();

    try {
      const files = await generator.generateApiClient(name, baseUrl, options);
      spinner.succeed(`Generated API client: ${name}`);
      
      logger.raw('\n📁 Generated files:');
      files.forEach(file => {
        logger.raw(`  • ${file}`);
      });

      logger.raw('\n💡 Next steps:');
      logger.raw(`  1. Define your API endpoints and types`);
      logger.raw(`  2. Add authentication and error handling`);
      logger.raw(`  3. Test your API client with real endpoints`);

    } catch (error) {
      spinner.fail('API client generation failed');
      throw error;
    }
  }

  /**
   * Generate tests for existing code
   */
  private async generateTests(
    generator: CodeGenerator,
    config: any,
    options: GenerationOptions
  ): Promise<void> {
    const spinner = logger.createSpinner('Generating test files...');
    spinner.start();

    try {
      // This would need to scan files first
      // For now, we'll show a message
      spinner.succeed('Test generation feature coming soon');
      
      logger.raw('\n💡 To generate tests:');
      logger.raw(`  1. Run "hydro scan" to analyze your codebase`);
      logger.raw(`  2. Use "hydro generate --tests" to create test files`);

    } catch (error) {
      spinner.fail('Test generation failed');
      throw error;
    }
  }

  /**
   * Show help for generate command
   */
  private showHelp(): void {
    logger.raw('\n🔧 Hydro Code Generator');
    logger.raw('─'.repeat(25));
    logger.raw('');
    logger.raw('Generate code, tests, and documentation for your project.');
    logger.raw('');
    logger.raw('Examples:');
    logger.raw('  hydro generate --component Button');
    logger.raw('  hydro generate --service UserService --language typescript');
    logger.raw('  hydro generate --api-client ApiClient --base-url https://api.example.com');
    logger.raw('  hydro generate --tests --language javascript');
    logger.raw('');
    logger.raw('Options:');
    logger.raw('  --component <name>     Generate React component');
    logger.raw('  --service <name>       Generate service class');
    logger.raw('  --api-client <name>    Generate API client');
    logger.raw('  --tests               Generate test files');
    logger.raw('  --language <lang>     Programming language');
    logger.raw('  --framework <fw>      Framework (react, vue, angular)');
    logger.raw('  --style <style>       Code style (functional, class, hooks)');
    logger.raw('  --include-types       Include TypeScript types');
    logger.raw('  --include-tests       Include test files (default: true)');
    logger.raw('  --include-docs        Include documentation');
    logger.raw('  --output <path>       Output directory (default: src)');
    logger.raw('  --base-url <url>      Base URL for API client');
  }
}
