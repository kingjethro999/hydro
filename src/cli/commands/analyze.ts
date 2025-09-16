/**
 * Analyze command - Perform specific analysis operations
 */

import { BaseCommand } from './base';
import { FileScanner } from '@/core/file-scanner';
import { DependencyAnalyzer } from '@/analyzers/dependency-analyzer';
import { logger } from '@/core/logger';

import type { CommandOptions, HydroConfig } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export class AnalyzeCommand extends BaseCommand {
  constructor() {
    super('analyze', 'Perform specific code analysis operations');
    
    this.command
      .option('--cycles', 'Find circular dependencies', false)
      .option('--complexity', 'Analyze code complexity', false)
      .option('--naming', 'Check naming conventions', false)
      .option('--sql', 'Analyze SQL usage', false)
      .option('--tests', 'Analyze test coverage', false)
      .option('--all', 'Run all analyzers', false)
      .option('--threshold <number>', 'Minimum severity level (1-4)', '1')
      .option('--export-graph', 'Export dependency graph as DOT file', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      cycles?: boolean;
      complexity?: boolean;
      naming?: boolean;
      sql?: boolean;
      tests?: boolean;
      all?: boolean;
      threshold?: string;
      exportGraph?: boolean;
    }
  ): Promise<void> {
    const config = await this.loadConfig();
    const targetPath = this.getTargetPath(options);
    const outputDir = await this.ensureOutputDir(config);

    // If no specific analyzer is selected, show help
    if (!options.cycles && !options.complexity && !options.naming && 
        !options.sql && !options.tests && !options.all) {
      logger.info('Please specify which analysis to run:');
      logger.info('  --cycles      Find circular dependencies');
      logger.info('  --complexity  Analyze code complexity');
      logger.info('  --naming      Check naming conventions');
      logger.info('  --sql         Analyze SQL usage');
      logger.info('  --tests       Analyze test coverage');
      logger.info('  --all         Run all analyzers');
      return;
    }

    logger.info(`Running analysis on: ${targetPath}`);

    const scanner = new FileScanner();
    const scanResult = await scanner.scanFiles(targetPath, config.scan);

    if (scanResult.totalFiles === 0) {
      logger.warn('No files found to analyze.');
      return;
    }

    logger.info(`Analyzing ${scanResult.totalFiles} files...`);

    // Circular dependency analysis
    if (options.cycles || options.all) {
      await this.analyzeDependencies(scanResult.files, config, outputDir, options);
    }

    // Complexity analysis
    if (options.complexity || options.all) {
      await this.analyzeComplexity(scanResult.files, config, outputDir, options);
    }

    // Naming analysis
    if (options.naming || options.all) {
      await this.analyzeNaming(scanResult.files, config, outputDir, options);
    }

    // SQL analysis
    if (options.sql || options.all) {
      await this.analyzeSql(scanResult.files, config, outputDir, options);
    }

    // Test analysis
    if (options.tests || options.all) {
      await this.analyzeTests(scanResult.files, config, outputDir, options);
    }

    logger.success('Analysis complete!');
  }

  /**
   * Analyze dependencies and circular references
   */
  private async analyzeDependencies(
    files: FileInfo[],
    config: HydroConfig,
    outputDir: string,
    options: CommandOptions & { exportGraph?: boolean }
  ): Promise<void> {
    const spinner = logger.createSpinner('Analyzing dependencies...');
    spinner.start();

    try {
      const analyzer = new DependencyAnalyzer();
      const issues = await analyzer.analyze(files, config.rules.dependencies);
      
      const circularDeps = issues.filter(issue => issue.type === 'circular-dependency');
      
      if (circularDeps.length === 0) {
        spinner.succeed('No circular dependencies found');
      } else {
        spinner.succeed(`Found ${circularDeps.length} circular dependencies`);
        
        logger.raw('\n🔄 Circular Dependencies:');
        logger.raw('─'.repeat(25));
        
        circularDeps.forEach((issue, index) => {
          logger.raw(`${index + 1}. ${issue.description}`);
          logger.raw(`   File: ${issue.file}`);
          logger.raw(`   Severity: ${issue.severity}`);
          if (issue.suggestion) {
            logger.raw(`   Suggestion: ${issue.suggestion}`);
          }
          logger.raw('');
        });
      }

      // Export dependency graph if requested
      if (options.exportGraph) {
        const graphPath = `${outputDir}/dependency-graph.dot`;
        await analyzer.exportDependencyGraph(files, graphPath);
        logger.info(`Dependency graph exported to: ${graphPath}`);
        logger.info('Generate PNG with: dot -Tpng dependency-graph.dot -o dependency-graph.png');
      }

      // Save results
      const outputPath = await this.saveOutput(
        { issues: circularDeps, timestamp: new Date() },
        'dependency-analysis',
        options.format || 'json',
        outputDir
      );
      
      logger.info(`Dependency analysis saved to: ${outputPath}`);

    } catch (error) {
      spinner.fail('Dependency analysis failed');
      throw error;
    }
  }

  /**
   * Analyze code complexity
   */
  private async analyzeComplexity(
    files: FileInfo[],
    config: HydroConfig,
    outputDir: string,
    options: CommandOptions
  ): Promise<void> {
    const spinner = logger.createSpinner('Analyzing complexity...');
    spinner.start();

    try {
      const { ComplexityAnalyzer } = await import('@/analyzers/complexity-analyzer');
      const analyzer = new ComplexityAnalyzer();
      
      const issues = await analyzer.analyze(files, config.rules.complexity);
      const metrics = await analyzer.calculateMetrics(files);

      spinner.succeed(`Found ${issues.length} complexity issues`);

      // Display complexity metrics
      logger.raw('\n📊 Complexity Metrics:');
      logger.raw('─'.repeat(21));
      this.displaySummary('Code Complexity', {
        'Average function length': `${metrics.averageFunctionLength} lines`,
        'Maximum function length': `${metrics.maxFunctionLength} lines`,
        'Average cyclomatic complexity': metrics.cyclomaticComplexity,
        'Maximum nesting depth': metrics.nestingDepth,
      });

      // Show top complexity issues
      if (issues.length > 0) {
        const topIssues = issues
          .filter(i => i.severity === 'high' || i.severity === 'critical')
          .slice(0, 10);

        if (topIssues.length > 0) {
          logger.raw('\n⚠️  Top Complexity Issues:');
          logger.raw('─'.repeat(24));
          
          topIssues.forEach((issue, index) => {
            logger.raw(`${index + 1}. ${issue.title} (${issue.severity})`);
            logger.raw(`   ${issue.file}:${issue.line || '?'}`);
            logger.raw(`   ${issue.description}`);
            logger.raw('');
          });
        }
      }

      // Save results
      const outputPath = await this.saveOutput(
        { issues, metrics, timestamp: new Date() },
        'complexity-analysis',
        options.format || 'json',
        outputDir
      );
      
      logger.info(`Complexity analysis saved to: ${outputPath}`);

    } catch (error) {
      spinner.fail('Complexity analysis failed');
      throw error;
    }
  }

  /**
   * Analyze naming conventions
   */
  private async analyzeNaming(
    files: FileInfo[],
    config: HydroConfig,
    outputDir: string,
    options: CommandOptions
  ): Promise<void> {
    if (!config.rules.naming) {
      logger.warn('No naming rules configured. Skipping naming analysis.');
      return;
    }

    const spinner = logger.createSpinner('Analyzing naming conventions...');
    spinner.start();

    try {
      const { NamingAnalyzer } = await import('@/analyzers/naming-analyzer');
      const analyzer = new NamingAnalyzer();
      
      const issues = await analyzer.analyze(files, config.rules.naming);

      spinner.succeed(`Found ${issues.length} naming violations`);

      if (issues.length > 0) {
        // Group by severity
        const grouped = issues.reduce((groups, issue) => {
          if (!groups[issue.severity]) groups[issue.severity] = [];
          groups[issue.severity]?.push(issue);
          return groups;
        }, {} as Record<string, any[]>);

        logger.raw('\n📝 Naming Convention Issues:');
        logger.raw('─'.repeat(28));

        ['critical', 'high', 'medium', 'low'].forEach(severity => {
          const severityIssues = grouped[severity];
          if (severityIssues && severityIssues.length > 0) {
            logger.raw(`\n${severity.toUpperCase()} (${severityIssues.length} issues):`);
            severityIssues.slice(0, 5).forEach(issue => {
              logger.raw(`  • ${issue.description}`);
              logger.raw(`    ${issue.file}:${issue.line || '?'}`);
            });
            if (severityIssues.length > 5) {
              logger.raw(`    ... and ${severityIssues.length - 5} more`);
            }
          }
        });
      }

      // Save results
      const outputPath = await this.saveOutput(
        { issues, timestamp: new Date() },
        'naming-analysis',
        options.format || 'json',
        outputDir
      );
      
      logger.info(`Naming analysis saved to: ${outputPath}`);

    } catch (error) {
      spinner.fail('Naming analysis failed');
      throw error;
    }
  }

  /**
   * Analyze SQL usage
   */
  private async analyzeSql(
    files: FileInfo[],
    config: HydroConfig,
    outputDir: string,
    options: CommandOptions
  ): Promise<void> {
    if (!config.rules.sql) {
      logger.warn('No SQL rules configured. Skipping SQL analysis.');
      return;
    }

    const spinner = logger.createSpinner('Analyzing SQL usage...');
    spinner.start();

    try {
      const { SqlAnalyzer } = await import('@/analyzers/sql-analyzer');
      const analyzer = new SqlAnalyzer();
      
      const issues = await analyzer.analyze(files, config.rules.sql);

      spinner.succeed(`Found ${issues.length} SQL issues`);

      if (issues.length > 0) {
        // Group by category
        const categories = issues.reduce((cats, issue) => {
          const category = issue.category;
          if (!cats[category]) cats[category] = [];
          cats[category].push(issue);
          return cats;
        }, {} as Record<string, any[]>);

        logger.raw('\n🗃️  SQL Issues by Category:');
        logger.raw('─'.repeat(25));

        Object.entries(categories).forEach(([category, categoryIssues]) => {
          logger.raw(`\n${category.toUpperCase()} (${categoryIssues.length} issues):`);
          categoryIssues.slice(0, 3).forEach(issue => {
            logger.raw(`  • ${issue.title} (${issue.severity})`);
            logger.raw(`    ${issue.file}:${issue.line || '?'}`);
          });
          if (categoryIssues.length > 3) {
            logger.raw(`    ... and ${categoryIssues.length - 3} more`);
          }
        });
      }

      // Save results
      const outputPath = await this.saveOutput(
        { issues, timestamp: new Date() },
        'sql-analysis',
        options.format || 'json',
        outputDir
      );
      
      logger.info(`SQL analysis saved to: ${outputPath}`);

    } catch (error) {
      spinner.fail('SQL analysis failed');
      throw error;
    }
  }

  /**
   * Analyze test coverage
   */
  private async analyzeTests(
    files: FileInfo[],
    config: HydroConfig,
    outputDir: string,
    options: CommandOptions
  ): Promise<void> {
    const spinner = logger.createSpinner('Analyzing test coverage...');
    spinner.start();

    try {
      const { TestAnalyzer } = await import('@/analyzers/test-analyzer');
      const analyzer = new TestAnalyzer();
      
      const issues = await analyzer.analyze(files);
      const metrics = await analyzer.calculateMetrics(files);

      spinner.succeed(`Found ${issues.length} test gaps`);

      // Display test metrics
      logger.raw('\n🧪 Test Coverage Metrics:');
      logger.raw('─'.repeat(24));
      this.displaySummary('Testing Overview', {
        'Coverage estimate': `${metrics.coverage}%`,
        'Test files': metrics.testFiles,
        'Test-to-code ratio': `1:${metrics.testToCodeRatio.toFixed(1)}`,
        'Potential flaky tests': metrics.flakyTests,
      });

      // Show test gaps
      if (issues.length > 0) {
        const highPriorityGaps = issues.filter(i => i.severity === 'high');
        
        if (highPriorityGaps.length > 0) {
          logger.raw('\n🎯 High Priority Test Gaps:');
          logger.raw('─'.repeat(26));
          
          highPriorityGaps.slice(0, 10).forEach((issue, index) => {
            logger.raw(`${index + 1}. ${issue.file}`);
            logger.raw(`   ${issue.description}`);
            logger.raw(`   Suggestion: ${issue.suggestion}`);
            logger.raw('');
          });
        }
      }

      // Save results
      const outputPath = await this.saveOutput(
        { issues, metrics, timestamp: new Date() },
        'test-analysis',
        options.format || 'json',
        outputDir
      );
      
      logger.info(`Test analysis saved to: ${outputPath}`);

    } catch (error) {
      spinner.fail('Test analysis failed');
      throw error;
    }
  }
}
