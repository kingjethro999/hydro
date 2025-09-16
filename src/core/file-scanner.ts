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

      // Process each file
      for (const filePath of allFiles) {
        try {
          const fileInfo = await this.analyzeFile(filePath, rootPath, config);
          if (fileInfo) {
            result.files.push(fileInfo);
            result.totalSize += fileInfo.size;
            if (fileInfo.language) {
              result.languages.add(fileInfo.language);
            }
          }
        } catch (error) {
          logger.debug(`Skipped file ${filePath}: ${error}`);
          result.skippedFiles.push(filePath);
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

    return {
      path: filePath,
      relativePath,
      size: stats.size,
      extension,
      language,
      lastModified: stats.mtime,
    };
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
      stats[lang].files++;
      stats[lang].size += file.size;
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
   * Get file content with encoding detection
   */
  public async readFileContent(filePath: string): Promise<string> {
    try {
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
}
