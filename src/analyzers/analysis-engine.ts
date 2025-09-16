/**
 * Core analysis engine for Hydro
 */

import { logger } from '@/core/logger';
import { ComplexityAnalyzer } from './complexity-analyzer';
import { DependencyAnalyzer } from './dependency-analyzer';
import { NamingAnalyzer } from './naming-analyzer';
import { SqlAnalyzer } from './sql-analyzer';
import { TestAnalyzer } from './test-analyzer';

import type { 
  AnalysisResult, 
  HydroConfig, 
  Issue,
  ProjectMetrics,
  AnalysisSummary,
} from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export interface AnalysisOptions {
  comprehensive: boolean;
  threshold: number;
  includeMetrics: boolean;
}

export class AnalysisEngine {
  private analyzers: {
    complexity: ComplexityAnalyzer;
    dependency: DependencyAnalyzer;
    naming: NamingAnalyzer;
    sql: SqlAnalyzer;
    test: TestAnalyzer;
  };

  constructor() {
    this.analyzers = {
      complexity: new ComplexityAnalyzer(),
      dependency: new DependencyAnalyzer(),
      naming: new NamingAnalyzer(),
      sql: new SqlAnalyzer(),
      test: new TestAnalyzer(),
    };
  }

  /**
   * Analyze entire project
   */
  public async analyzeProject(
    projectPath: string,
    files: FileInfo[],
    config: HydroConfig,
    options: AnalysisOptions
  ): Promise<AnalysisResult> {
    const spinner = logger.createSpinner('Analyzing project...');
    spinner.start();

    try {
      const issues: Issue[] = [];
      const startTime = Date.now();

      // Run all analyzers
      if (options.comprehensive) {
        spinner.update('Running comprehensive analysis...');
        
        // Dependency analysis
        const dependencyIssues = await this.analyzers.dependency.analyze(
          files, 
          config.rules.dependencies
        );
        issues.push(...dependencyIssues);

        // Complexity analysis
        const complexityIssues = await this.analyzers.complexity.analyze(
          files,
          config.rules.complexity
        );
        issues.push(...complexityIssues);

        // Naming analysis
        if (config.rules.naming) {
          const namingIssues = await this.analyzers.naming.analyze(
            files,
            config.rules.naming
          );
          issues.push(...namingIssues);
        }

        // SQL analysis
        if (config.rules.sql && config.languages.includes('sql')) {
          const sqlIssues = await this.analyzers.sql.analyze(
            files,
            config.rules.sql
          );
          issues.push(...sqlIssues);
        }

        // Test analysis
        const testIssues = await this.analyzers.test.analyze(files);
        issues.push(...testIssues);
      } else {
        spinner.update('Running basic analysis...');
        
        // Basic analysis - just dependency and complexity
        const dependencyIssues = await this.analyzers.dependency.analyze(
          files,
          config.rules.dependencies
        );
        issues.push(...dependencyIssues);

        const complexityIssues = await this.analyzers.complexity.analyze(
          files,
          config.rules.complexity
        );
        issues.push(...complexityIssues);
      }

      // Filter by threshold
      const filteredIssues = this.filterIssuesByThreshold(issues, options.threshold);

      // Calculate metrics
      const metrics = options.includeMetrics 
        ? await this.calculateMetrics(files, filteredIssues)
        : this.getDefaultMetrics();

      // Generate summary
      const summary = this.generateSummary(files, filteredIssues, metrics);

      const analysisTime = Date.now() - startTime;
      spinner.succeed(`Analysis completed in ${analysisTime}ms`);

      return {
        timestamp: new Date(),
        projectPath,
        summary,
        issues: filteredIssues,
        metrics,
      };
    } catch (error) {
      spinner.fail('Analysis failed');
      throw error;
    }
  }

  /**
   * Filter issues by severity threshold
   */
  private filterIssuesByThreshold(issues: Issue[], threshold: number): Issue[] {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    
    return issues.filter(issue => {
      const issueLevel = severityOrder[issue.severity];
      return issueLevel >= threshold;
    });
  }

  /**
   * Calculate comprehensive project metrics
   */
  private async calculateMetrics(files: FileInfo[], issues: Issue[]): Promise<ProjectMetrics> {
    const spinner = logger.createSpinner('Calculating metrics...');
    spinner.start();

    try {
      // Complexity metrics
      const complexityMetrics = await this.analyzers.complexity.calculateMetrics(files);
      
      // Dependency metrics
      const dependencyMetrics = await this.analyzers.dependency.calculateMetrics(files);
      
      // Testing metrics
      const testingMetrics = await this.analyzers.test.calculateMetrics(files);
      
      // Maintainability metrics
      const maintainabilityMetrics = this.calculateMaintainabilityMetrics(files, issues);

      spinner.stop();

      return {
        complexity: complexityMetrics,
        dependencies: dependencyMetrics,
        testing: testingMetrics,
        maintainability: maintainabilityMetrics,
      };
    } catch (error) {
      spinner.fail('Metrics calculation failed');
      throw error;
    }
  }

  /**
   * Calculate maintainability metrics
   */
  private calculateMaintainabilityMetrics(
    files: FileInfo[], 
    issues: Issue[]
  ): ProjectMetrics['maintainability'] {
    // Tech debt estimation (simplified)
    const techDebtHours = issues.reduce((total, issue) => {
      const hoursByType: Record<string, number> = {
        'god-file': 4,
        'complex-function': 2,
        'circular-dependency': 6,
        'naming-violation': 0.5,
        'sql-issue': 3,
        'test-gap': 2,
        'dependency-issue': 1,
      };
      return total + (hoursByType[issue.type] || 1);
    }, 0);

    // Simplified calculations for other metrics
    // const totalFiles = files.length; // Used in metrics calculation
    const codeFiles = files.filter(f => f.language && f.language !== 'json');
    
    return {
      techDebtHours: Math.round(techDebtHours),
      duplicateCodePercentage: Math.min(15, issues.filter(i => i.type === 'tech-debt').length * 2),
      documentationCoverage: Math.max(40, 90 - issues.filter(i => i.category === 'documentation').length * 10),
      codeChurn: Math.round(codeFiles.length * 0.1), // Simplified estimation
    };
  }

  /**
   * Generate analysis summary
   */
  private generateSummary(
    files: FileInfo[], 
    issues: Issue[], 
    metrics: ProjectMetrics
  ): AnalysisSummary {
    const totalLines = files.reduce((sum, file) => sum + Math.round(file.size / 25), 0); // Rough estimate
    
    // Language statistics
    const languageStats = files.reduce((stats, file) => {
      if (file.language) {
        if (!stats[file.language]) {
          stats[file.language] = { files: 0, size: 0 };
        }
        const langStats = stats[file.language];
        if (langStats) {
          langStats.files++;
          langStats.size += file.size;
        }
      }
      return stats;
    }, {} as Record<string, { files: number; size: number }>);

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const languages = Object.entries(languageStats).map(([language, data]) => ({
      language,
      files: data.files,
      lines: Math.round(data.size / 25), // Rough estimate
      percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
    }));

    // Tech debt score (0-100, lower is better)
    const techDebtScore = Math.min(100, Math.round(
      (issues.length * 2) + 
      (metrics.maintainability.techDebtHours * 0.5) +
      (100 - metrics.testing.coverage) * 0.3 +
      (metrics.maintainability.duplicateCodePercentage * 0.5)
    ));

    return {
      totalFiles: files.length,
      totalLines,
      languages,
      issueCount: issues.length,
      techDebtScore,
    };
  }

  /**
   * Get default metrics when not calculating comprehensive metrics
   */
  private getDefaultMetrics(): ProjectMetrics {
    return {
      complexity: {
        averageFunctionLength: 0,
        maxFunctionLength: 0,
        cyclomaticComplexity: 0,
        nestingDepth: 0,
      },
      dependencies: {
        totalDependencies: 0,
        outdatedDependencies: 0,
        vulnerableDependencies: 0,
        circularDependencies: 0,
      },
      testing: {
        coverage: 0,
        testFiles: 0,
        testToCodeRatio: 0,
        flakyTests: 0,
      },
      maintainability: {
        techDebtHours: 0,
        duplicateCodePercentage: 0,
        documentationCoverage: 0,
        codeChurn: 0,
      },
    };
  }

  /**
   * Analyze specific file
   */
  public async analyzeFile(
    filePath: string,
    config: HydroConfig
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Create a FileInfo object for the single file
    const fs = await import('fs-extra');
    const path = await import('path');
    
    const stats = await fs.stat(filePath);
    const fileInfo: FileInfo = {
      path: filePath,
      relativePath: path.relative(process.cwd(), filePath),
      size: stats.size,
      extension: path.extname(filePath),
      language: this.detectLanguage(filePath),
      lastModified: stats.mtime,
    };

    // Run applicable analyzers
    if (fileInfo.language && ['javascript', 'typescript'].includes(fileInfo.language)) {
      const complexityIssues = await this.analyzers.complexity.analyze(
        [fileInfo],
        config.rules.complexity
      );
      issues.push(...complexityIssues);
    }

    if (config.rules.naming) {
      const namingIssues = await this.analyzers.naming.analyze(
        [fileInfo],
        config.rules.naming
      );
      issues.push(...namingIssues);
    }

    return issues;
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(filePath: string): string | null {
    const path = require('path');
    const extension = path.extname(filePath).toLowerCase();
    
    const languageMap: Record<string, string> = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.cs': 'csharp',
      '.sql': 'sql',
    };

    return languageMap[extension] || null;
  }
}
