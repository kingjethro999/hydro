/**
 * File scanning and filtering utilities for Hydro
 */

import fs from 'fs-extra';
import { glob } from 'glob';
import path from 'path';

import { logger } from './logger';

import type { ScanConfig } from '@/types';

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  extension: string;
  language: string | null;
  lastModified: Date;
}

export interface ScanResult {
  files: FileInfo[];
  totalFiles: number;
  totalSize: number;
  languages: Set<string>;
  skippedFiles: string[];
}

export class FileScanner {
  private fileCache = new Map<string, { fileInfo: FileInfo; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CONCURRENT_FILES = 50; // Limit concurrent file operations
  private readonly OPTIMAL_BATCH_SIZE = 200; // Optimized batch size
  private readonly STREAM_THRESHOLD = 1024 * 1024; // 1MB - use streaming for larger files

  private languageMap: Record<string, string> = {
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.py': 'python',
    '.pyx': 'python',
    '.java': 'java',
    '.kt': 'kotlin',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.cs': 'csharp',
    '.fs': 'fsharp',
    '.vb': 'vbnet',
    '.cpp': 'cpp',
    '.cc': 'cpp',
    '.cxx': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.sql': 'sql',
    '.psql': 'sql',
    '.mysql': 'sql',
    '.html': 'html',
    '.htm': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sass': 'sass',
    '.less': 'less',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'zsh',
    '.fish': 'fish',
    '.ps1': 'powershell',
    '.bat': 'batch',
    '.cmd': 'batch',
  };

  /**
   * Scan directory for files based on configuration
   */
  public async scanFiles(
    rootPath: string,
    config: ScanConfig
  ): Promise<ScanResult> {
    const spinner = logger.createSpinner('Scanning files...');
    spinner.start();

    try {
      const result: ScanResult = {
        files: [],
        totalFiles: 0,
        totalSize: 0,
        languages: new Set(),
        skippedFiles: [],
      };

      // Build glob patterns
      const includePatterns = this.buildIncludePatterns(config.include);
      const excludePatterns = this.buildExcludePatterns(config.exclude);

      // Find all files matching include patterns
      const allFiles = new Set<string>();
      for (const pattern of includePatterns) {
        const matches = await glob(pattern, {
          cwd: rootPath,
          absolute: true,
          ignore: excludePatterns,
          dot: false, // Don't include hidden files by default
        });
        matches.forEach(file => allFiles.add(file));
      }

      logger.debug(`Found ${allFiles.size} files matching patterns`);

      // Process files in optimized batches with concurrency control
      const fileArray = Array.from(allFiles);
      const totalFiles = fileArray.length;
      
      // Use dynamic batch sizing based on file count
      const batchSize = Math.min(
        this.OPTIMAL_BATCH_SIZE,
        Math.max(50, Math.floor(totalFiles / 10))
      );
      
      for (let i = 0; i < fileArray.length; i += batchSize) {
        const batch = fileArray.slice(i, i + batchSize);
        
        // Process batch with concurrency control
        const batchResults = await this.processBatchWithConcurrencyControl(
          batch,
          rootPath,
          config
        );
        
        for (const { fileInfo, error, filePath } of batchResults) {
          if (fileInfo) {
            result.files.push(fileInfo);
            result.totalSize += fileInfo.size;
            if (fileInfo.language) {
              result.languages.add(fileInfo.language);
            }
          } else if (error) {
            logger.debug(`Skipped file: ${error}`);
            result.skippedFiles.push(filePath);
          }
        }

        // Update progress with more detailed information
        const processed = Math.min(i + batchSize, totalFiles);
        const progress = Math.min(100, Math.round((processed / totalFiles) * 100));
        const processedSize = this.formatBytes(result.totalSize);
        spinner.update(`Scanning files... ${progress}% (${processed}/${totalFiles}, ${processedSize})`);
        
        // Force garbage collection hint for large batches
        if (i % (batchSize * 5) === 0 && global.gc) {
          global.gc();
        }
      }

      result.totalFiles = result.files.length;

      spinner.succeed(`Scanned ${result.totalFiles} files (${this.formatBytes(result.totalSize)})`);
      
      return result;
    } catch (error) {
      spinner.fail('File scanning failed');
      throw error;
    }
  }

  /**
   * Analyze a single file
   */
  private async analyzeFile(
    filePath: string,
    rootPath: string,
    config: ScanConfig
  ): Promise<FileInfo | null> {
    // Check cache first
    const cached = this.fileCache.get(filePath);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.fileInfo;
    }

    const stats = await fs.stat(filePath);

    // Check file size limit
    if (config.maxFileSize && stats.size > config.maxFileSize) {
      logger.debug(`Skipping large file: ${filePath} (${this.formatBytes(stats.size)})`);
      return null;
    }

    // Skip directories
    if (stats.isDirectory()) {
      return null;
    }

    const relativePath = path.relative(rootPath, filePath);
    const extension = path.extname(filePath).toLowerCase();
    const language = this.languageMap[extension] || null;

    const fileInfo: FileInfo = {
      path: filePath,
      relativePath,
      size: stats.size,
      extension,
      language,
      lastModified: stats.mtime,
    };

    // Cache the result
    this.fileCache.set(filePath, { fileInfo, timestamp: Date.now() });

    return fileInfo;
  }

  /**
   * Build include glob patterns
   */
  private buildIncludePatterns(include: string[]): string[] {
    if (include.length === 0) {
      return ['**/*'];
    }

    return include.flatMap(pattern => {
      // If pattern is a directory, include all files in it
      if (!pattern.includes('*') && !pattern.includes('.')) {
        return [
          `${pattern}/**/*`,
          `${pattern}/*`,
        ];
      }
      return [pattern];
    });
  }

  /**
   * Build exclude glob patterns
   */
  private buildExcludePatterns(exclude: string[]): string[] {
    const defaultExcludes = [
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.hydro/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.map',
    ];

    return [...defaultExcludes, ...exclude.map(pattern => 
      pattern.includes('*') ? pattern : `${pattern}/**`
    )];
  }

  /**
   * Get files by language
   */
  public filterByLanguage(files: FileInfo[], language: string): FileInfo[] {
    return files.filter(file => file.language === language);
  }

  /**
   * Get files by extension
   */
  public filterByExtension(files: FileInfo[], extension: string): FileInfo[] {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return files.filter(file => file.extension === ext);
  }

  /**
   * Get files larger than specified size
   */
  public filterByMinSize(files: FileInfo[], minSize: number): FileInfo[] {
    return files.filter(file => file.size >= minSize);
  }

  /**
   * Get recently modified files
   */
  public filterByRecentModification(files: FileInfo[], days: number): FileInfo[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return files.filter(file => file.lastModified > cutoffDate);
  }

  /**
   * Sort files by size (descending)
   */
  public sortBySize(files: FileInfo[]): FileInfo[] {
    return [...files].sort((a, b) => b.size - a.size);
  }

  /**
   * Sort files by modification date (newest first)
   */
  public sortByModificationDate(files: FileInfo[]): FileInfo[] {
    return [...files].sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  /**
   * Get language statistics
   */
  public getLanguageStats(files: FileInfo[]): Record<string, { files: number; size: number; percentage: number }> {
    const stats: Record<string, { files: number; size: number }> = {};
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    files.forEach(file => {
      const lang = file.language || 'unknown';
      if (!stats[lang]) {
        stats[lang] = { files: 0, size: 0 };
      }
      const langStats = stats[lang];
      if (langStats) {
        langStats.files++;
        langStats.size += file.size;
      }
    });

    // Add percentage calculation
    const result: Record<string, { files: number; size: number; percentage: number }> = {};
    Object.entries(stats).forEach(([lang, data]) => {
      result[lang] = {
        ...data,
        percentage: totalSize > 0 ? (data.size / totalSize) * 100 : 0,
      };
    });

    return result;
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
   * Check if file should be analyzed based on language support
   */
  public isAnalyzableFile(file: FileInfo, supportedLanguages: string[]): boolean {
    if (!file.language) return false;
    return supportedLanguages.includes(file.language);
  }

  /**
   * Process batch with concurrency control to prevent memory overload
   */
  private async processBatchWithConcurrencyControl(
    batch: string[],
    rootPath: string,
    config: ScanConfig
  ): Promise<Array<{ fileInfo: FileInfo | null; error: any; filePath: string }>> {
    const results: Array<{ fileInfo: FileInfo | null; error: any; filePath: string }> = [];
    
    // Process files in smaller chunks to control concurrency
    for (let i = 0; i < batch.length; i += this.MAX_CONCURRENT_FILES) {
      const chunk = batch.slice(i, i + this.MAX_CONCURRENT_FILES);
      
      const chunkPromises = chunk.map(async (filePath) => {
        try {
          const fileInfo = await this.analyzeFile(filePath, rootPath, config);
          return { fileInfo, error: null, filePath };
        } catch (error) {
          return { fileInfo: null, error, filePath };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Get file content with encoding detection and streaming for large files
   */
  public async readFileContent(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath);
      
      // Use streaming for large files to prevent memory issues
      if (stats.size > this.STREAM_THRESHOLD) {
        return await this.readFileContentStreaming(filePath);
      }
      
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      // Try with different encodings if UTF-8 fails
      try {
        return await fs.readFile(filePath, 'latin1');
      } catch {
        throw new Error(`Unable to read file: ${filePath}`);
      }
    }
  }

  /**
   * Read large file content using streaming to manage memory
   */
  private async readFileContentStreaming(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
      
      stream.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks).toString('utf8'));
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Clear the file cache
   */
  public clearCache(): void {
    this.fileCache.clear();
  }

  /**
   * Clean up expired cache entries
   */
  public cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.fileCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.fileCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.fileCache.size,
      hitRate: 0, // Would need to track hits/misses for accurate hit rate
    };
  }
}
