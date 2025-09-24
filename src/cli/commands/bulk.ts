/**
 * Bulk operations command for large-scale processing
 */

import { BaseCommand } from './base';
import { FileScanner } from '@/core/file-scanner';
import { AnalysisEngine } from '@/analyzers/analysis-engine';
import { AIService } from '@/ai/ai-service';
import { BulkOperations } from '@/utils/bulk-operations';
import { ProgressTracker, ProgressDisplay } from '@/utils/progress-tracker';
import { logger } from '@/core/logger';

import type { CommandOptions, HydroConfig } from '@/types';
import type { FileInfo } from '@/core/file-scanner';

export class BulkCommand extends BaseCommand {
  private aiService = AIService.getInstance();

  constructor() {
    super('bulk', 'Perform bulk operations on large codebases');
    
    this.command
      .option('--analyze', 'Run comprehensive analysis on all files', false)
      .option('--scan-only', 'Only scan files without analysis', false)
      .option('--ai-analyze', 'Run AI-powered analysis on all files', false)
      .option('--ai-suggestions', 'Generate AI suggestions for improvements', false)
      .option('--ai-refactor', 'Get AI refactoring suggestions', false)
      .option('--batch-size <number>', 'Batch size for processing', '200')
      .option('--max-concurrency <number>', 'Maximum concurrent operations', '10')
      .option('--ai-batch-size <number>', 'AI batch size for processing', '5')
      .option('--memory-limit <size>', 'Memory limit (e.g., 512MB, 1GB)', '1GB')
      .option('--progress-interval <ms>', 'Progress update interval in milliseconds', '1000')
      .option('--output-format <format>', 'Output format (json, csv, table)', 'json')
      .option('--stream-large-files', 'Use streaming for large files', true)
      .option('--deep-analysis', 'Perform deep AI analysis', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      analyze?: boolean;
      scanOnly?: boolean;
      aiAnalyze?: boolean;
      aiSuggestions?: boolean;
      aiRefactor?: boolean;
      batchSize?: string;
      maxConcurrency?: string;
      aiBatchSize?: string;
      memoryLimit?: string;
      progressInterval?: string;
      outputFormat?: string;
      streamLargeFiles?: boolean;
      deepAnalysis?: boolean;
    }
  ): Promise<void> {
    const config = await this.loadConfig();
    const targetPath = this.getTargetPath(options);
    const outputDir = await this.ensureOutputDir(config);

    // Parse options
    const batchSize = parseInt(options.batchSize || '200', 10);
    const maxConcurrency = parseInt(options.maxConcurrency || '10', 10);
    const aiBatchSize = parseInt(options.aiBatchSize || '5', 10);
    const progressInterval = parseInt(options.progressInterval || '1000', 10);
    const memoryLimit = this.parseMemoryLimit(options.memoryLimit || '1GB');

    logger.info(`Starting bulk operations on: ${targetPath}`);
    logger.info(`Configuration: batch size=${batchSize}, concurrency=${maxConcurrency}, AI batch size=${aiBatchSize}, memory limit=${this.formatBytes(memoryLimit)}`);

    // Initialize AI service
    await this.aiService.initialize();

    const scanner = new FileScanner();
    const analysisEngine = new AnalysisEngine();

    // Enhanced file scanning with progress tracking
    const scanResult = await this.scanFilesWithProgress(scanner, targetPath, config, progressInterval);

    if (scanResult.totalFiles === 0) {
      logger.warn('No files found to process.');
      return;
    }

    logger.info(`Found ${scanResult.totalFiles} files (${this.formatBytes(scanResult.totalSize)})`);

    if (options.scanOnly) {
      await this.saveScanResults(scanResult, outputDir, options.outputFormat || 'json');
      logger.success('File scanning completed!');
      return;
    }

    if (options.analyze) {
      await this.runBulkAnalysis(
        analysisEngine,
        targetPath,
        scanResult.files,
        config,
        {
          batchSize,
          maxConcurrency,
          memoryLimit,
          progressInterval,
          outputFormat: options.outputFormat || 'json',
          streamLargeFiles: options.streamLargeFiles !== false
        },
        outputDir
      );
    }

    // AI-powered operations
    if (options.aiAnalyze || options.aiSuggestions || options.aiRefactor) {
      await this.runBulkAIAnalysis(
        targetPath,
        scanResult.files,
        config,
        {
          aiAnalyze: options.aiAnalyze || false,
          aiSuggestions: options.aiSuggestions || false,
          aiRefactor: options.aiRefactor || false,
          aiBatchSize,
          deepAnalysis: options.deepAnalysis || false,
          outputFormat: options.outputFormat || 'json'
        },
        outputDir
      );
    }

    logger.success('Bulk operations completed!');
  }

  /**
   * Scan files with enhanced progress tracking
   */
  private async scanFilesWithProgress(
    scanner: FileScanner,
    targetPath: string,
    config: HydroConfig,
    progressInterval: number
  ): Promise<any> {
    const spinner = logger.createSpinner('Scanning files...');
    spinner.start();

    try {
      // Create progress tracker
      const progressTracker = new ProgressTracker(
        Number.MAX_SAFE_INTEGER, // We don't know total files yet
        1,
        (info) => {
          spinner.update(`Scanning files... ${info.percentage.toFixed(1)}% (${info.current} files, ${info.memoryUsage})`);
        },
        progressInterval
      );

      const scanResult = await scanner.scanFiles(targetPath, config.scan);
      
      progressTracker.complete();
      spinner.succeed(`Scanned ${scanResult.totalFiles} files (${this.formatBytes(scanResult.totalSize)})`);
      
      return scanResult;
    } catch (error) {
      spinner.fail('File scanning failed');
      throw error;
    }
  }

  /**
   * Run bulk analysis with optimized processing
   */
  private async runBulkAnalysis(
    analysisEngine: AnalysisEngine,
    targetPath: string,
    files: FileInfo[],
    config: HydroConfig,
    options: {
      batchSize: number;
      maxConcurrency: number;
      memoryLimit: number;
      progressInterval: number;
      outputFormat: string;
      streamLargeFiles: boolean;
    },
    outputDir: string
  ): Promise<void> {
    const spinner = logger.createSpinner('Running bulk analysis...');
    spinner.start();

    try {
      // Create progress tracker
      const progressTracker = new ProgressTracker(
        files.length,
        Math.ceil(files.length / options.batchSize),
        (info) => {
          const display = ProgressDisplay.createDetailedDisplay(info);
          spinner.update(`Analyzing... ${display}`);
          
          // Additional progress display for bulk operations
          if (info.currentBatch % 5 === 0) {
            logger.debug(`Bulk progress: ${info.current}/${info.total} files (${info.percentage.toFixed(1)}%)`);
            logger.debug(`Memory usage: ${info.memoryUsage}`);
            logger.debug(`Processing rate: ${info.processingRate.toFixed(1)} files/sec`);
          }
        },
        options.progressInterval
      );

      // Run analysis with progress tracking
      const analysisResult = await analysisEngine.analyzeProject(
        targetPath,
        files,
        config,
        {
          comprehensive: true,
          threshold: 1,
          includeMetrics: true,
          progressCallback: (info) => {
            progressTracker.update(info.processed || 0, info.currentBatch || 0);
          }
        }
      );

      progressTracker.complete();
      spinner.succeed(`Analysis completed: ${analysisResult.issues.length} issues found`);

      // Save results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = await this.saveOutput(
        analysisResult,
        `bulk-analysis-${timestamp}`,
        options.outputFormat,
        outputDir
      );

      logger.info(`Bulk analysis results saved to: ${outputPath}`);

      // Display summary
      this.displayBulkAnalysisSummary(analysisResult);

    } catch (error) {
      spinner.fail('Bulk analysis failed');
      throw error;
    }
  }

  /**
   * Save scan results
   */
  private async saveScanResults(
    scanResult: any,
    outputDir: string,
    format: string
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = await this.saveOutput(
      scanResult,
      `bulk-scan-${timestamp}`,
      format,
      outputDir
    );
    
    logger.info(`Scan results saved to: ${outputPath}`);
  }

  /**
   * Run bulk AI analysis
   */
  private async runBulkAIAnalysis(
    targetPath: string,
    files: FileInfo[],
    config: HydroConfig,
    options: {
      aiAnalyze: boolean;
      aiSuggestions: boolean;
      aiRefactor: boolean;
      aiBatchSize: number;
      deepAnalysis: boolean;
      outputFormat: string;
    },
    outputDir: string
  ): Promise<void> {
    const spinner = logger.createSpinner('Running AI analysis...');
    spinner.start();

    try {
      // Get codebase info for AI context
      const codebaseInfo = {
        totalFiles: files.length,
        languages: this.extractLanguages(files),
        metrics: this.calculateMetrics(files)
      };

      const aiOperations: any[] = [];

      // Prepare AI operations based on options
      if (options.aiAnalyze) {
        files.slice(0, Math.min(50, files.length)).forEach(file => {
          aiOperations.push({
            query: `Analyze this code file for quality, performance, and security issues`,
            context: `File: ${file.path}\nSize: ${file.size} bytes\nLanguage: ${this.getFileLanguage(file.path)}`,
            type: 'analysis'
          });
        });
      }

      if (options.aiSuggestions) {
        aiOperations.push({
          query: `Provide intelligent suggestions for improving this codebase`,
          context: `Codebase: ${codebaseInfo.totalFiles} files, Languages: ${codebaseInfo.languages.join(', ')}`,
          type: 'suggestion'
        });
      }

      if (options.aiRefactor) {
        files.slice(0, Math.min(20, files.length)).forEach(file => {
          aiOperations.push({
            query: `Suggest refactoring improvements for this code`,
            context: `File: ${file.path}\nLanguage: ${this.getFileLanguage(file.path)}`,
            type: 'refactor'
          });
        });
      }

      // Process AI operations in batches
      const results = await this.aiService.processBulkOperations({
        operations: aiOperations,
        batchSize: options.aiBatchSize,
        maxConcurrency: 3
      });

      spinner.succeed(`AI analysis completed: ${results.length} operations processed`);

      // Save AI results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const aiResults = {
        timestamp,
        codebaseInfo,
        operations: aiOperations,
        results,
        summary: this.generateAISummary(results)
      };

      const outputPath = await this.saveOutput(
        aiResults,
        `bulk-ai-analysis-${timestamp}`,
        options.outputFormat,
        outputDir
      );

      logger.info(`AI analysis results saved to: ${outputPath}`);

      // Display AI summary
      this.displayAIAnalysisSummary(aiResults);

    } catch (error) {
      spinner.fail('AI analysis failed');
      throw error;
    }
  }

  /**
   * Display bulk analysis summary
   */
  private displayBulkAnalysisSummary(result: any): void {
    logger.raw('\n📊 Bulk Analysis Summary:');
    logger.raw('─'.repeat(25));
    
    const summary = result.summary;
    logger.raw(`Total Files: ${summary.totalFiles}`);
    logger.raw(`Total Lines: ${summary.totalLines.toLocaleString()}`);
    logger.raw(`Issues Found: ${summary.issueCount}`);
    logger.raw(`Tech Debt Score: ${summary.techDebtScore}/100`);
    
    // Language breakdown
    if (summary.languages && summary.languages.length > 0) {
      logger.raw('\n📝 Languages:');
      summary.languages.forEach((lang: any) => {
        logger.raw(`  ${lang.language}: ${lang.files} files (${lang.percentage.toFixed(1)}%)`);
      });
    }
    
    // Issue breakdown by severity
    const issuesBySeverity = result.issues.reduce((acc: any, issue: any) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
    
    if (Object.keys(issuesBySeverity).length > 0) {
      logger.raw('\n⚠️  Issues by Severity:');
      Object.entries(issuesBySeverity).forEach(([severity, count]) => {
        logger.raw(`  ${severity}: ${count}`);
      });
    }
  }

  /**
   * Parse memory limit string (e.g., "512MB", "1GB")
   */
  private parseMemoryLimit(limit: string): number {
    const match = limit.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
    if (!match) {
      throw new Error(`Invalid memory limit format: ${limit}`);
    }
    
    const value = parseFloat(match[1]!);
    const unit = (match[2] || 'MB').toUpperCase();
    
    const multipliers: Record<string, number> = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    return value * (multipliers[unit] || multipliers['MB']!);
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Extract languages from files
   */
  private extractLanguages(files: FileInfo[]): string[] {
    const languageMap = new Map<string, number>();
    
    files.forEach(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      const language = this.getFileLanguage(file.path);
      languageMap.set(language, (languageMap.get(language) || 0) + 1);
    });

    return Array.from(languageMap.keys()).sort((a, b) => 
      (languageMap.get(b) || 0) - (languageMap.get(a) || 0)
    );
  }

  /**
   * Get file language from extension
   */
  private getFileLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown'
    };

    return languageMap[ext || ''] || 'unknown';
  }

  /**
   * Calculate basic metrics from files
   */
  private calculateMetrics(files: FileInfo[]): any {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const avgSize = files.length > 0 ? totalSize / files.length : 0;

    return {
      totalFiles: files.length,
      totalSize,
      averageFileSize: avgSize,
      largestFile: Math.max(...files.map(f => f.size)),
      smallestFile: Math.min(...files.map(f => f.size))
    };
  }

  /**
   * Generate AI analysis summary
   */
  private generateAISummary(results: any[]): any {
    const totalResults = results.length;
    const highConfidenceResults = results.filter(r => r.confidence > 0.8).length;
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / totalResults;

    const allSuggestions = results.flatMap(r => r.suggestions || []);
    const uniqueSuggestions = [...new Set(allSuggestions)];

    return {
      totalResults,
      highConfidenceResults,
      averageConfidence: avgConfidence,
      totalSuggestions: allSuggestions.length,
      uniqueSuggestions: uniqueSuggestions.length,
      topSuggestions: uniqueSuggestions.slice(0, 10)
    };
  }

  /**
   * Display AI analysis summary
   */
  private displayAIAnalysisSummary(result: any): void {
    logger.raw('\n🤖 AI Analysis Summary:');
    logger.raw('─'.repeat(25));
    
    const summary = result.summary;
    logger.raw(`Total AI Operations: ${summary.totalResults}`);
    logger.raw(`High Confidence Results: ${summary.highConfidenceResults}`);
    logger.raw(`Average Confidence: ${(summary.averageConfidence * 100).toFixed(1)}%`);
    logger.raw(`Total Suggestions: ${summary.totalSuggestions}`);
    logger.raw(`Unique Suggestions: ${summary.uniqueSuggestions}`);
    
    if (summary.topSuggestions.length > 0) {
      logger.raw('\n💡 Top AI Suggestions:');
      summary.topSuggestions.forEach((suggestion: string, index: number) => {
        logger.raw(`  ${index + 1}. ${suggestion}`);
      });
    }
  }
}
