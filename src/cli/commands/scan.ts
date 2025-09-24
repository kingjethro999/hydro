/**
 * Scan command - Analyze project files and generate baseline report
 */

import { BaseCommand } from './base';
import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';
import { AnalysisEngine } from '@/analyzers/analysis-engine';

import type { CommandOptions, AnalysisResult } from '@/types';

class ScanCommand extends BaseCommand {
  constructor() {
    super('scan', 'Scan project files and generate analysis report');
    
    this.command
      .option('--full', 'Perform comprehensive analysis (slower but more thorough)', false)
      .option('--baseline', 'Create baseline scan for future comparisons', false)
      .option('--threshold <number>', 'Set minimum issue severity threshold (1-4)', '1')
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & { 
      full?: boolean; 
      baseline?: boolean; 
      threshold?: string;
    }
  ): Promise<void> {
    const config = await this.loadConfig();
    const targetPath = this.getTargetPath(options);
    const outputDir = await this.ensureOutputDir(config);

    logger.info(`Scanning project: ${config.project}`);
    logger.info(`Target path: ${targetPath}`);

    const scanner = new FileScanner();
    const analysisEngine = new AnalysisEngine();

    // Scan files
    const scanResult = await scanner.scanFiles(targetPath, config.scan);
    
    if (scanResult.totalFiles === 0) {
      logger.warn('No files found to analyze. Check your include/exclude patterns.');
      return;
    }

    logger.info(`Found ${scanResult.totalFiles} files in ${scanResult.languages.size} languages`);

    // Display language statistics
    const languageStats = scanner.getLanguageStats(scanResult.files);
    this.displayLanguageStats(languageStats);

    // Perform analysis
    const analysisOptions = {
      comprehensive: options.full || false,
      threshold: parseInt(options.threshold || '1', 10),
      includeMetrics: true,
    };

    const analysisResult = await analysisEngine.analyzeProject(
      targetPath,
      scanResult.files,
      config,
      analysisOptions
    );

    // Display summary
    this.displayAnalysisSummary(analysisResult);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = options.baseline ? 'baseline' : `scan-${timestamp}`;
    
    const outputPath = await this.saveOutput(
      analysisResult,
      filename,
      options.format || 'json',
      outputDir
    );

    logger.success(`Analysis complete! Report saved to: ${outputPath}`);

    // Save baseline if requested
    if (options.baseline) {
      const baselinePath = await this.saveOutput(
        analysisResult,
        'baseline',
        'json',
        '.hydro'
      );
      logger.info(`Baseline saved to: ${baselinePath}`);
    }

    // Display recommendations
    this.displayRecommendations(analysisResult);
  }

  /**
   * Display language statistics
   */
  private displayLanguageStats(
    stats: Record<string, { files: number; size: number; percentage: number }>
  ): void {
    logger.raw('\n📊 Language Distribution:');
    logger.raw('─'.repeat(25));

    const sortedStats = Object.entries(stats)
      .sort(([, a], [, b]) => b.percentage - a.percentage);

    const tableData = sortedStats.map(([language, data]) => ({
      Language: language.charAt(0).toUpperCase() + language.slice(1),
      Files: data.files.toString(),
      'Size %': `${data.percentage.toFixed(1)}%`,
      'Avg Size': `${Math.round(data.size / data.files)} bytes`,
    }));

    logger.table(tableData);
  }

  /**
   * Display analysis summary
   */
  private displayAnalysisSummary(result: AnalysisResult): void {
    const { summary, issues, metrics } = result;

    logger.raw('\n🔍 Analysis Summary:');
    logger.raw('─'.repeat(20));

    this.displaySummary('Project Overview', {
      'Total files': summary.totalFiles,
      'Total lines': summary.totalLines.toLocaleString(),
      'Issues found': summary.issueCount,
      'Tech debt score': `${summary.techDebtScore}/100`,
    });

    if (issues.length > 0) {
      logger.raw('\n⚠️  Issues by Category:');
      logger.raw('─'.repeat(22));

      const issuesByCategory = this.groupIssuesByCategory(issues);
      const categoryData = Object.entries(issuesByCategory).map(([category, categoryIssues]) => ({
        Category: category.charAt(0).toUpperCase() + category.slice(1),
        Count: categoryIssues.length.toString(),
        Critical: categoryIssues.filter(i => i.severity === 'critical').length.toString(),
        High: categoryIssues.filter(i => i.severity === 'high').length.toString(),
        Medium: categoryIssues.filter(i => i.severity === 'medium').length.toString(),
        Low: categoryIssues.filter(i => i.severity === 'low').length.toString(),
      }));

      logger.table(categoryData);
    }

    // Display key metrics
    logger.raw('\n📈 Key Metrics:');
    logger.raw('─'.repeat(14));

    this.displaySummary('Complexity', {
      'Avg function length': `${metrics.complexity.averageFunctionLength} lines`,
      'Max function length': `${metrics.complexity.maxFunctionLength} lines`,
      'Cyclomatic complexity': metrics.complexity.cyclomaticComplexity,
      'Max nesting depth': metrics.complexity.nestingDepth,
    });

    this.displaySummary('Dependencies', {
      'Total dependencies': metrics.dependencies.totalDependencies,
      'Outdated': metrics.dependencies.outdatedDependencies,
      'Vulnerable': metrics.dependencies.vulnerableDependencies,
      'Circular deps': metrics.dependencies.circularDependencies,
    });

    this.displaySummary('Testing', {
      'Coverage': `${metrics.testing.coverage}%`,
      'Test files': metrics.testing.testFiles,
      'Test-to-code ratio': `1:${metrics.testing.testToCodeRatio.toFixed(1)}`,
      'Flaky tests': metrics.testing.flakyTests,
    });

    this.displaySummary('Maintainability', {
      'Tech debt hours': metrics.maintainability.techDebtHours,
      'Duplicate code': `${metrics.maintainability.duplicateCodePercentage}%`,
      'Documentation coverage': `${metrics.maintainability.documentationCoverage}%`,
      'Code churn': metrics.maintainability.codeChurn,
    });
  }

  /**
   * Group issues by category
   */
  private groupIssuesByCategory(issues: AnalysisResult['issues']): Record<string, AnalysisResult['issues']> {
    return issues.reduce((groups, issue) => {
      const category = issue.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      const categoryGroup = groups[category];
      if (categoryGroup) {
        categoryGroup.push(issue);
      }
      return groups;
    }, {} as Record<string, AnalysisResult['issues']>);
  }

  /**
   * Display actionable recommendations
   */
  private displayRecommendations(result: AnalysisResult): void {
    const { issues, metrics } = result;
    const recommendations: string[] = [];

    // High-priority issues
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');

    if (criticalIssues.length > 0) {
      recommendations.push(`🚨 Address ${criticalIssues.length} critical issues immediately`);
    }

    if (highIssues.length > 0) {
      recommendations.push(`⚠️  Review ${highIssues.length} high-priority issues`);
    }

    // Complexity recommendations
    if (metrics.complexity.maxFunctionLength > 200) {
      recommendations.push('📏 Consider breaking down large functions (>200 lines)');
    }

    if (metrics.complexity.cyclomaticComplexity > 15) {
      recommendations.push('🔄 Reduce cyclomatic complexity in complex functions');
    }

    // Dependency recommendations
    if (metrics.dependencies.outdatedDependencies > 0) {
      recommendations.push(`📦 Update ${metrics.dependencies.outdatedDependencies} outdated dependencies`);
    }

    if (metrics.dependencies.vulnerableDependencies > 0) {
      recommendations.push(`🔒 Fix ${metrics.dependencies.vulnerableDependencies} security vulnerabilities`);
    }

    if (metrics.dependencies.circularDependencies > 0) {
      recommendations.push('♻️  Resolve circular dependencies for better modularity');
    }

    // Testing recommendations
    if (metrics.testing.coverage < 80) {
      recommendations.push(`🧪 Increase test coverage from ${metrics.testing.coverage}% to 80%+`);
    }

    if (metrics.testing.flakyTests > 0) {
      recommendations.push(`🎲 Fix ${metrics.testing.flakyTests} flaky tests for reliable CI`);
    }

    // Maintainability recommendations
    if (metrics.maintainability.duplicateCodePercentage > 10) {
      recommendations.push('🔄 Reduce code duplication through refactoring');
    }

    if (metrics.maintainability.documentationCoverage < 70) {
      recommendations.push('📚 Improve documentation coverage');
    }

    if (recommendations.length > 0) {
      logger.raw('\n💡 Recommendations:');
      logger.raw('─'.repeat(17));
      recommendations.forEach((rec, index) => {
        logger.raw(`${index + 1}. ${rec}`);
      });

      logger.raw('\n🔧 Next Steps:');
      logger.raw('─'.repeat(12));
      logger.raw('• Run "hydro analyze --cycles" to find circular dependencies');
      logger.raw('• Run "hydro hotspots --size 200" to find large files');
      logger.raw('• Run "hydro test-suggest" to generate test scaffolds');
      logger.raw('• Run "hydro deps audit" to check dependency issues');
    } else {
      logger.success('\n🎉 Great job! No major issues found.');
    }
  }
}

export { ScanCommand };
