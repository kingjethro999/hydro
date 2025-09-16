/**
 * File system utilities for Hydro
 */

import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

import { logger } from '@/core/logger';

export interface FileHash {
  path: string;
  hash: string;
  size: number;
  modified: Date;
}

export interface DirectoryStats {
  totalFiles: number;
  totalSize: number;
  largestFile: { path: string; size: number };
  oldestFile: { path: string; modified: Date };
  newestFile: { path: string; modified: Date };
}

export class FileUtils {
  /**
   * Calculate MD5 hash of a file
   */
  public static async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('md5').update(content).digest('hex');
    } catch (error) {
      logger.debug(`Failed to calculate hash for ${filePath}: ${error}`);
      throw error;
    }
  }

  /**
   * Calculate hashes for multiple files
   */
  public static async calculateFileHashes(filePaths: string[]): Promise<FileHash[]> {
    const hashes: FileHash[] = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const hash = await this.calculateFileHash(filePath);
        
        hashes.push({
          path: filePath,
          hash,
          size: stats.size,
          modified: stats.mtime,
        });
      } catch (error) {
        logger.debug(`Failed to process ${filePath}: ${error}`);
      }
    }

    return hashes;
  }

  /**
   * Find duplicate files by hash
   */
  public static async findDuplicateFiles(filePaths: string[]): Promise<Map<string, string[]>> {
    const hashes = await this.calculateFileHashes(filePaths);
    const duplicates = new Map<string, string[]>();

    // Group files by hash
    const hashGroups = new Map<string, string[]>();
    
    hashes.forEach(({ path, hash }) => {
      const existing = hashGroups.get(hash) || [];
      existing.push(path);
      hashGroups.set(hash, existing);
    });

    // Find groups with multiple files (duplicates)
    hashGroups.forEach((paths, hash) => {
      if (paths.length > 1) {
        duplicates.set(hash, paths);
      }
    });

    return duplicates;
  }

  /**
   * Get directory statistics
   */
  public static async getDirectoryStats(dirPath: string): Promise<DirectoryStats> {
    const files = await this.getAllFiles(dirPath);
    
    if (files.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        largestFile: { path: '', size: 0 },
        oldestFile: { path: '', modified: new Date() },
        newestFile: { path: '', modified: new Date() },
      };
    }

    let totalSize = 0;
    let largestFile = { path: files[0] || '', size: 0 };
    let oldestFile = { path: files[0] || '', modified: new Date() };
    let newestFile = { path: files[0] || '', modified: new Date(0) };

    for (const file of files) {
      try {
        const stats = await fs.stat(file);
        
        totalSize += stats.size;
        
        if (stats.size > largestFile.size) {
          largestFile = { path: file, size: stats.size };
        }
        
        if (stats.mtime < oldestFile.modified) {
          oldestFile = { path: file, modified: stats.mtime };
        }
        
        if (stats.mtime > newestFile.modified) {
          newestFile = { path: file, modified: stats.mtime };
        }
      } catch (error) {
        logger.debug(`Failed to get stats for ${file}: ${error}`);
      }
    }

    return {
      totalFiles: files.length,
      totalSize,
      largestFile,
      oldestFile,
      newestFile,
    };
  }

  /**
   * Get all files in directory recursively
   */
  public static async getAllFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    async function traverse(currentPath: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isDirectory()) {
            await traverse(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        logger.debug(`Failed to traverse ${currentPath}: ${error}`);
      }
    }
    
    await traverse(dirPath);
    return files;
  }

  /**
   * Create a temporary file with content
   */
  public static async createTempFile(content: string, extension: string = '.tmp'): Promise<string> {
    const tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'hydro-'));
    const tempFile = path.join(tempDir, `temp${extension}`);
    
    await fs.writeFile(tempFile, content, 'utf8');
    return tempFile;
  }

  /**
   * Clean up temporary files
   */
  public static async cleanupTempFiles(tempPaths: string[]): Promise<void> {
    for (const tempPath of tempPaths) {
      try {
        await fs.remove(tempPath);
      } catch (error) {
        logger.debug(`Failed to cleanup temp file ${tempPath}: ${error}`);
      }
    }
  }

  /**
   * Copy file with progress callback
   */
  public static async copyFileWithProgress(
    src: string,
    dest: string,
    onProgress?: (bytesWritten: number, totalBytes: number) => void
  ): Promise<void> {
    const stats = await fs.stat(src);
    const totalBytes = stats.size;
    
    await fs.ensureDir(path.dirname(dest));
    
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(src);
      const writeStream = fs.createWriteStream(dest);
      
      let bytesWritten = 0;
      
      readStream.on('data', (chunk) => {
        bytesWritten += chunk.length;
        if (onProgress) {
          onProgress(bytesWritten, totalBytes);
        }
      });
      
      readStream.on('error', reject);
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
      
      readStream.pipe(writeStream);
    });
  }

  /**
   * Move file atomically
   */
  public static async moveFileAtomic(src: string, dest: string): Promise<void> {
    try {
      // Try rename first (atomic on same filesystem)
      await fs.rename(src, dest);
    } catch (error) {
      // Fallback to copy + delete (not atomic but works across filesystems)
      await fs.copy(src, dest);
      await fs.remove(src);
    }
  }

  /**
   * Get file extension without dot
   */
  public static getExtension(filePath: string): string {
    return path.extname(filePath).slice(1).toLowerCase();
  }

  /**
   * Get file name without extension
   */
  public static getBaseName(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Check if file is binary
   */
  public static async isBinaryFile(filePath: string): Promise<boolean> {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Check first 8000 bytes for null bytes (common in binary files)
      const chunk = buffer.slice(0, Math.min(8000, buffer.length));
      
      for (let i = 0; i < chunk.length; i++) {
        if (chunk[i] === 0) {
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get file MIME type based on extension
   */
  public static getMimeType(filePath: string): string {
    const ext = this.getExtension(filePath);
    const mimeTypes: Record<string, string> = {
      // Text files
      'txt': 'text/plain',
      'md': 'text/markdown',
      'json': 'application/json',
      'xml': 'application/xml',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'ts': 'application/typescript',
      'jsx': 'application/javascript',
      'tsx': 'application/typescript',
      'py': 'text/x-python',
      'java': 'text/x-java-source',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
      'php': 'text/x-php',
      'rb': 'text/x-ruby',
      'sql': 'application/sql',
      'yml': 'application/yaml',
      'yaml': 'application/yaml',
      
      // Images
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      
      // Archives
      'zip': 'application/zip',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      '7z': 'application/x-7z-compressed',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Format file size in human-readable format
   */
  public static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if path is within another path
   */
  public static isPathWithin(childPath: string, parentPath: string): boolean {
    const relative = path.relative(parentPath, childPath);
    return !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  /**
   * Create a file with atomic write (write to temp file then rename)
   */
  public static async writeFileAtomic(filePath: string, content: string): Promise<void> {
    const tempPath = `${filePath}.tmp.${Date.now()}`;
    
    try {
      await fs.writeFile(tempPath, content, 'utf8');
      await this.moveFileAtomic(tempPath, filePath);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.remove(tempPath);
      } catch {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Find files matching a pattern
   */
  public static async findFiles(
    rootPath: string,
    pattern: RegExp,
    options: { maxDepth?: number; includeDirectories?: boolean } = {}
  ): Promise<string[]> {
    const { maxDepth = Infinity, includeDirectories = false } = options;
    const matches: string[] = [];
    
    async function search(currentPath: string, depth: number): Promise<void> {
      if (depth > maxDepth) return;
      
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          
          if (entry.isFile() || (entry.isDirectory() && includeDirectories)) {
            if (pattern.test(entry.name)) {
              matches.push(fullPath);
            }
          }
          
          if (entry.isDirectory()) {
            await search(fullPath, depth + 1);
          }
        }
      } catch (error) {
        logger.debug(`Failed to search ${currentPath}: ${error}`);
      }
    }
    
    await search(rootPath, 0);
    return matches;
  }

  /**
   * Get relative path from project root
   */
  public static getRelativePath(filePath: string, rootPath: string = process.cwd()): string {
    return path.relative(rootPath, filePath);
  }

  /**
   * Ensure file has specific extension
   */
  public static ensureExtension(filePath: string, extension: string): string {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    return filePath.endsWith(ext) ? filePath : `${filePath}${ext}`;
  }
}
