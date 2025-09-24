/**
 * Hydro - The Unified Development Environment Catalyst
 * Main entry point for programmatic usage
 */

import { ConfigManager } from './core/config';
import { FileScanner } from './core/file-scanner';
import { SafetyManager } from './core/safety-manager';
import { AnalysisEngine } from './analyzers/analysis-engine';

import type {
  AnalysisResult,
} from './types';

// Core exports
export { ConfigManager } from './core/config';
export { FileScanner } from './core/file-scanner';
export { Logger, logger } from './core/logger';
export { SafetyManager } from './core/safety-manager';

// Analyzer exports
export { AnalysisEngine } from './analyzers/analysis-engine';
export { ComplexityAnalyzer } from './analyzers/complexity-analyzer';
export { DependencyAnalyzer } from './analyzers/dependency-analyzer';
export { NamingAnalyzer } from './analyzers/naming-analyzer';
export { SqlAnalyzer } from './analyzers/sql-analyzer';
export { TestAnalyzer } from './analyzers/test-analyzer';

// Utility exports
export { GitUtils } from './utils/git-utils';
export { FileUtils } from './utils/file-utils';

// Type exports
export type {
  HydroConfig,
  AnalysisResult,
  Issue,
  ProjectMetrics,
  CommandOptions,
  HydroPlugin,
  AnalyzerPlugin,
  CommandPlugin,
} from './types';

// Version
export const version = '1.0.0';

/**
 * Main Hydro class for programmatic usage
 */
export class Hydro {
  private configManager: ConfigManager;
  private analysisEngine: AnalysisEngine;
  private safetyManager: SafetyManager;

  constructor() {
    this.configManager = ConfigManager.getInstance();
    this.analysisEngine = new AnalysisEngine();
    this.safetyManager = SafetyManager.getInstance();
  }

  /**
   * Initialize Hydro with configuration
   */
  public async initialize(configPath?: string): Promise<void> {
    await this.configManager.loadConfig(configPath);
    await this.safetyManager.initialize();
  }

  /**
   * Analyze project programmatically with optimized bulk processing
   */
  public async analyze(options: {
    path?: string;
    comprehensive?: boolean;
    threshold?: number;
    progressCallback?: (info: any) => void;
  } = {}): Promise<AnalysisResult> {
    const config = this.configManager.getConfig();
    const scanner = new FileScanner();
    
    // Enhanced file scanning with progress tracking
    const scanResult = await scanner.scanFiles(
      options.path || process.cwd(),
      config.scan
    );

    // Analyze with progress tracking
    return this.analysisEngine.analyzeProject(
      options.path || process.cwd(),
      scanResult.files,
      config,
      {
        comprehensive: options.comprehensive || false,
        threshold: options.threshold || 1,
        includeMetrics: true,
        ...(options.progressCallback && { progressCallback: options.progressCallback }),
      }
    );
  }

  /**
   * Get current configuration
   */
  public getConfig(): ReturnType<ConfigManager['getConfig']> {
    return this.configManager.getConfig();
  }

  /**
   * Update configuration
   */
  public async updateConfig(updates: Parameters<ConfigManager['updateConfig']>[0]): Promise<void> {
    return this.configManager.updateConfig(updates);
  }
}

// Default export
export default Hydro;
