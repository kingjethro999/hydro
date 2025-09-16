/**
 * Performance Analyzer Plugin - Custom plugin example
 * Analyzes code for performance bottlenecks and optimization opportunities
 */

import { PluginType, Issue } from '@/types';
import { Plugin, PluginContext } from '@/plugins/plugin-manager';
import { FileScanner } from '@/core/file-scanner';
import { logger } from '@/core/logger';

import type { FileInfo } from '@/core/file-scanner';

interface PerformanceMetrics {
  slowQueries: number;
  memoryLeaks: number;
  inefficientLoops: number;
  blockingOperations: number;
}

export class PerformanceAnalyzerPlugin implements Plugin {
  public readonly id = 'performance-analyzer';
  public readonly name = 'performance-analyzer';
  public readonly version = '1.0.0';
  public readonly type: PluginType = 'analyzer';
  public readonly description = 'Analyzes code for performance bottlenecks and optimization opportunities';
  public readonly author = 'Hydro Team';
  public readonly entryPoint = './performance-analyzer.js';
  public readonly dependencies: string[] = [];
  public readonly enabled = true;

  private fileScanner = new FileScanner();

  async analyze(context: PluginContext): Promise<Issue[]> {
    const files = context.files;
    const issues: Issue[] = [];
    const codeFiles = files.filter((f: FileInfo) => this.isAnalyzableFile(f));

    logger.debug(`Performance analysis: analyzing ${codeFiles.length} files`);

    for (const file of codeFiles) {
      try {
        const content = await this.fileScanner.readFileContent(file.path);
        const fileIssues = await this.analyzeFile(file, content);
        issues.push(...fileIssues);
      } catch (error) {
        logger.debug(`Failed to analyze performance for ${file.path}: ${error}`);
      }
    }

    return issues;
  }

  private async analyzeFile(file: FileInfo, content: string): Promise<Issue[]> {
    const issues: Issue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const lineNumber = i + 1;

      // Check for N+1 query patterns
      if (this.detectNPlusOneQuery(line)) {
        issues.push({
          id: `n-plus-one-${file.relativePath}-${lineNumber}`,
          type: 'performance-issue',
          severity: 'high',
          category: 'performance',
          title: 'Potential N+1 Query Problem',
          description: 'Loop with database query detected - may cause N+1 query problem',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Consider using batch loading or JOIN queries to reduce database calls',
          autoFixable: false,
        });
      }

      // Check for inefficient loops
      if (this.detectInefficientLoop(line)) {
        issues.push({
          id: `inefficient-loop-${file.relativePath}-${lineNumber}`,
          type: 'performance-issue',
          severity: 'medium',
          category: 'performance',
          title: 'Inefficient Loop Pattern',
          description: 'Loop with potential performance issues detected',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Consider using more efficient iteration methods or data structures',
          autoFixable: false,
        });
      }

      // Check for blocking operations
      if (this.detectBlockingOperation(line)) {
        issues.push({
          id: `blocking-operation-${file.relativePath}-${lineNumber}`,
          type: 'performance-issue',
          severity: 'high',
          category: 'performance',
          title: 'Blocking Operation Detected',
          description: 'Synchronous operation that may block the event loop',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Consider using async/await or non-blocking alternatives',
          autoFixable: false,
        });
      }

      // Check for memory leaks
      if (this.detectMemoryLeak(line)) {
        issues.push({
          id: `memory-leak-${file.relativePath}-${lineNumber}`,
          type: 'performance-issue',
          severity: 'high',
          category: 'performance',
          title: 'Potential Memory Leak',
          description: 'Code pattern that may cause memory leaks',
          file: file.relativePath,
          line: lineNumber,
          column: 0,
          suggestion: 'Ensure proper cleanup of event listeners, timers, or large objects',
          autoFixable: false,
        });
      }
    }

    return issues;
  }

  private detectNPlusOneQuery(line: string): boolean {
    const patterns = [
      /for\s*\([^)]*\)\s*\{[^}]*\.(?:find|findOne|query|select)/i,
      /forEach\s*\([^)]*\)\s*=>\s*\{[^}]*\.(?:find|findOne|query|select)/i,
      /while\s*\([^)]*\)\s*\{[^}]*\.(?:find|findOne|query|select)/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectInefficientLoop(line: string): boolean {
    const patterns = [
      /for\s*\([^)]*\)\s*\{[^}]*\.(?:push|unshift|splice)/i,
      /\.map\s*\([^)]*\)\s*\.(?:map|filter|reduce)/i,
      /\.filter\s*\([^)]*\)\s*\.(?:map|filter|reduce)/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectBlockingOperation(line: string): boolean {
    const patterns = [
      /fs\.(?:readFileSync|writeFileSync|existsSync)/i,
      /JSON\.(?:parse|stringify)/i,
      /crypto\.(?:pbkdf2Sync|scryptSync)/i,
      /child_process\.(?:execSync|spawnSync)/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private detectMemoryLeak(line: string): boolean {
    const patterns = [
      /addEventListener\s*\([^)]*\)(?!.*removeEventListener)/i,
      /setInterval\s*\([^)]*\)(?!.*clearInterval)/i,
      /setTimeout\s*\([^)]*\)(?!.*clearTimeout)/i,
      /new\s+EventEmitter\s*\(\)(?!.*removeAllListeners)/i,
    ];
    return patterns.some(pattern => pattern.test(line));
  }

  private isAnalyzableFile(file: FileInfo): boolean {
    const analyzableLanguages = ['javascript', 'typescript', 'python', 'java'];
    return file.language ? analyzableLanguages.includes(file.language) : false;
  }

  async calculateMetrics(context: PluginContext): Promise<PerformanceMetrics> {
    const issues = await this.analyze(context);
    
    return {
      slowQueries: issues.filter(i => i.id.includes('n-plus-one')).length,
      memoryLeaks: issues.filter(i => i.id.includes('memory-leak')).length,
      inefficientLoops: issues.filter(i => i.id.includes('inefficient-loop')).length,
      blockingOperations: issues.filter(i => i.id.includes('blocking-operation')).length,
    };
  }
}
