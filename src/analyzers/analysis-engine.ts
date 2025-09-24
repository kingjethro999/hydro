/**
 * Core analysis engine for Hydro
 */

import { logger } from '@/core/logger';
import { errorHandler, createFileNotFoundError, createParsingError } from '@/utils/error-handler';
import { ComplexityAnalyzer } from './complexity-analyzer';
import { DependencyAnalyzer } from './dependency-analyzer';
import { NamingAnalyzer } from './naming-analyzer';
import { SecurityAnalyzer } from './security-analyzer';
import { SqlAnalyzer } from './sql-analyzer';
import { TeamMetricsAnalyzer } from './team-metrics-analyzer';
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
  progressCallback?: (info: any) => void;
}

export class AnalysisEngine {
  private analyzers: {
    complexity: ComplexityAnalyzer;
    dependency: DependencyAnalyzer;
    naming: NamingAnalyzer;
    security: SecurityAnalyzer;
    sql: SqlAnalyzer;
    teamMetrics: TeamMetricsAnalyzer;
    test: TestAnalyzer;
  };
  
  private readonly MAX_CONCURRENT_ANALYZERS = 3; // Limit concurrent analyzer execution
  private readonly BULK_ANALYSIS_BATCH_SIZE = 100; // Process files in batches during analysis

  constructor() {
    this.analyzers = {
      complexity: new ComplexityAnalyzer(),
      dependency: new DependencyAnalyzer(),
      naming: new NamingAnalyzer(),
      security: new SecurityAnalyzer(),
      sql: new SqlAnalyzer(),
      teamMetrics: new TeamMetricsAnalyzer(),
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

      // Run all analyzers with optimized bulk processing
      if (options.comprehensive) {
        spinner.update('Running comprehensive analysis...');
        
        // Process files in batches for better memory management
        const analysisBatches = this.createAnalysisBatches(files, this.BULK_ANALYSIS_BATCH_SIZE);
        let processedBatches = 0;
        
        for (const batch of analysisBatches) {
          spinner.update(`Analyzing batch ${processedBatches + 1}/${analysisBatches.length} (${batch.length} files)...`);
          
          // Run analyzers concurrently with controlled concurrency
          const batchIssues = await this.runAnalyzersConcurrently(batch, config, true);
          issues.push(...batchIssues);
          
          processedBatches++;
          
          // Memory management: force GC every few batches
          if (processedBatches % 5 === 0 && global.gc) {
            global.gc();
          }
        }
      } else {
        spinner.update('Running basic analysis...');
        
        // Basic analysis with batch processing
        const analysisBatches = this.createAnalysisBatches(files, this.BULK_ANALYSIS_BATCH_SIZE);
        
        for (const batch of analysisBatches) {
          const batchIssues = await this.runAnalyzersConcurrently(batch, config, false);
          issues.push(...batchIssues);
        }
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
   * Create analysis batches for better memory management
   */
  private createAnalysisBatches(files: FileInfo[], batchSize: number): FileInfo[][] {
    const batches: FileInfo[][] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Run analyzers concurrently with controlled concurrency
   */
  private async runAnalyzersConcurrently(
    files: FileInfo[],
    config: HydroConfig,
    comprehensive: boolean
  ): Promise<Issue[]> {
    const issues: Issue[] = [];
    
    // Create analyzer tasks
    const analyzerTasks: Array<() => Promise<Issue[]>> = [];
    
    // Always run dependency and complexity analysis
    analyzerTasks.push(async () => {
      const dependencyIssues = await this.analyzers.dependency.analyze(files, config.rules.dependencies);
      return dependencyIssues;
    });
    
    analyzerTasks.push(async () => {
      const complexityIssues = await this.analyzers.complexity.analyze(files, config.rules.complexity);
      return complexityIssues;
    });
    
    if (comprehensive) {
      // Add comprehensive analysis tasks
      if (config.rules.naming) {
        analyzerTasks.push(async () => {
          const namingIssues = await this.analyzers.naming.analyze(files, config.rules.naming!);
          return namingIssues;
        });
      }
      
      if (config.rules.sql && config.languages.includes('sql')) {
        analyzerTasks.push(async () => {
          const sqlIssues = await this.analyzers.sql.analyze(files, config.rules.sql!);
          return sqlIssues;
        });
      }
      
      if (config.rules.security) {
        analyzerTasks.push(async () => {
          const securityIssues = await this.analyzers.security.analyze(files, config.rules.security!);
          return securityIssues;
        });
      }
      
      analyzerTasks.push(async () => {
        const testIssues = await this.analyzers.test.analyze(files);
        return testIssues;
      });
    }
    
    // Run analyzers with controlled concurrency
    const concurrencyLimit = Math.min(this.MAX_CONCURRENT_ANALYZERS, analyzerTasks.length);
    const results: Issue[][] = [];
    
    for (let i = 0; i < analyzerTasks.length; i += concurrencyLimit) {
      const batch = analyzerTasks.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch.map(task => task()));
      results.push(...batchResults);
    }
    
    // Flatten results
    for (const result of results) {
      issues.push(...result);
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
