/**
 * Safety manager for handling dry-run operations, rollbacks, and test gates
 */

import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

import { logger } from './logger';

export interface SafetyOptions {
  dryRun: boolean;
  requireTests: boolean;
  createBackup: boolean;
  maxFiles: number;
}

export interface OperationContext {
  id: string;
  description: string;
  files: string[];
  timestamp: Date;
  backupPath?: string;
}

export interface ChangeSet {
  file: string;
  operation: 'create' | 'modify' | 'delete';
  originalContent?: string;
  newContent?: string;
}

export class SafetyManager {
  private static instance: SafetyManager;
  private operations = new Map<string, OperationContext>();
  private backupDir = '.hydro/backups';

  private constructor() {}

  public static getInstance(): SafetyManager {
    if (!SafetyManager.instance) {
      SafetyManager.instance = new SafetyManager();
    }
    return SafetyManager.instance;
  }

  /**
   * Initialize safety manager
   */
  public async initialize(): Promise<void> {
    await fs.ensureDir(this.backupDir);
    await fs.ensureDir('.hydro/logs');
  }

  /**
   * Start a safe operation
   */
  public async startOperation(
    description: string,
    files: string[],
    options: SafetyOptions
  ): Promise<string> {
    const operationId = this.generateOperationId();
    const context: OperationContext = {
      id: operationId,
      description,
      files,
      timestamp: new Date(),
    };

    // Validate operation constraints
    this.validateOperation(files, options);

    // Create backup if required
    if (options.createBackup && !options.dryRun) {
      context.backupPath = await this.createBackup(operationId, files);
    }

    // Run tests if required
    if (options.requireTests && !options.dryRun) {
      await this.runTestGate();
    }

    this.operations.set(operationId, context);
    
    logger.debug(`Started operation ${operationId}: ${description}`);
    return operationId;
  }

  /**
   * Apply changes safely
   */
  public async applyChanges(
    operationId: string,
    changes: ChangeSet[],
    options: SafetyOptions
  ): Promise<void> {
    const context = this.operations.get(operationId);
    if (!context) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (options.dryRun) {
      this.logDryRunChanges(changes);
      return;
    }

    const spinner = logger.createSpinner(`Applying ${changes.length} changes...`);
    spinner.start();

    try {
      // Apply changes atomically
      await this.applyChangesAtomically(changes);
      
      // Run tests after changes
      if (options.requireTests) {
        await this.runTestGate();
      }

      spinner.succeed(`Applied ${changes.length} changes successfully`);
      
      // Log successful operation
      await this.logOperation(operationId, changes, 'success');
      
    } catch (error) {
      spinner.fail('Changes failed, rolling back...');
      
      // Rollback changes
      await this.rollbackOperation(operationId);
      
      // Log failed operation
      await this.logOperation(operationId, changes, 'failed');
      
      throw error;
    }
  }

  /**
   * Rollback an operation
   */
  public async rollbackOperation(operationId: string): Promise<void> {
    const context = this.operations.get(operationId);
    if (!context) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (!context.backupPath) {
      throw new Error(`No backup available for operation ${operationId}`);
    }

    const spinner = logger.createSpinner('Rolling back changes...');
    spinner.start();

    try {
      await this.restoreFromBackup(context.backupPath, context.files);
      spinner.succeed('Rollback completed successfully');
      
      logger.info(`Operation ${operationId} rolled back successfully`);
    } catch (error) {
      spinner.fail('Rollback failed');
      throw error;
    }
  }

  /**
   * Preview changes in dry-run mode
   */
  public previewChanges(changes: ChangeSet[]): void {
    logger.raw('\n🔍 Dry Run - Changes Preview:');
    logger.raw('─'.repeat(30));

    const summary = {
      create: 0,
      modify: 0,
      delete: 0,
    };

    changes.forEach((change, index) => {
      summary[change.operation]++;
      
      logger.raw(`\n${index + 1}. ${change.operation.toUpperCase()}: ${change.file}`);
      
      if (change.operation === 'modify' && change.originalContent && change.newContent) {
        const diff = this.generateSimpleDiff(change.originalContent, change.newContent);
        if (diff.length > 0) {
          logger.raw('   Changes:');
          diff.slice(0, 5).forEach(line => logger.raw(`     ${line}`));
          if (diff.length > 5) {
            logger.raw(`     ... and ${diff.length - 5} more changes`);
          }
        }
      }
    });

    logger.raw('\n📊 Summary:');
    logger.raw(`   Files to create: ${summary.create}`);
    logger.raw(`   Files to modify: ${summary.modify}`);
    logger.raw(`   Files to delete: ${summary.delete}`);
    logger.raw('\nUse --apply to execute these changes.');
  }

  /**
   * Validate operation constraints
   */
  private validateOperation(files: string[], options: SafetyOptions): void {
    if (files.length > options.maxFiles) {
      throw new Error(
        `Operation affects ${files.length} files, exceeding limit of ${options.maxFiles}. ` +
        'Use --max-files to increase the limit or narrow the scope.'
      );
    }

    // Check for critical files
    const criticalFiles = files.filter(file => this.isCriticalFile(file));
    if (criticalFiles.length > 0 && !options.dryRun) {
      logger.warn(`Operation affects critical files: ${criticalFiles.join(', ')}`);
      logger.warn('Consider running with --dry-run first to preview changes.');
    }
  }

  /**
   * Check if file is critical
   */
  private isCriticalFile(file: string): boolean {
    const criticalPatterns = [
      'package.json',
      'tsconfig.json',
      'webpack.config.js',
      '.env',
      'Dockerfile',
      'docker-compose.yml',
    ];

    return criticalPatterns.some(pattern => 
      path.basename(file).toLowerCase() === pattern.toLowerCase()
    );
  }

  /**
   * Create backup of files
   */
  private async createBackup(operationId: string, files: string[]): Promise<string> {
    const backupPath = path.join(this.backupDir, operationId);
    await fs.ensureDir(backupPath);

    for (const file of files) {
      try {
        if (await fs.pathExists(file)) {
          const relativePath = path.relative(process.cwd(), file);
          const backupFilePath = path.join(backupPath, relativePath);
          
          await fs.ensureDir(path.dirname(backupFilePath));
          await fs.copy(file, backupFilePath);
        }
      } catch (error) {
        logger.debug(`Failed to backup ${file}: ${error}`);
      }
    }

    // Create backup manifest
    const manifest = {
      operationId,
      timestamp: new Date(),
      files,
    };
    
    await fs.writeJSON(path.join(backupPath, 'manifest.json'), manifest, { spaces: 2 });
    
    return backupPath;
  }

  /**
   * Restore files from backup
   */
  private async restoreFromBackup(backupPath: string, _files: string[]): Promise<void> {
    const manifestPath = path.join(backupPath, 'manifest.json');
    
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Backup manifest not found: ${manifestPath}`);
    }

    const manifest = await fs.readJSON(manifestPath);
    
    for (const file of manifest.files) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        const backupFilePath = path.join(backupPath, relativePath);
        
        if (await fs.pathExists(backupFilePath)) {
          await fs.copy(backupFilePath, file);
        } else {
          // File was created in the operation, so delete it
          if (await fs.pathExists(file)) {
            await fs.remove(file);
          }
        }
      } catch (error) {
        logger.debug(`Failed to restore ${file}: ${error}`);
      }
    }
  }

  /**
   * Run test gate
   */
  private async runTestGate(): Promise<void> {
    const spinner = logger.createSpinner('Running test gate...');
    spinner.start();

    try {
      // Try different test commands in order of preference
      const testCommands = [
        'npm test',
        'npm run test',
        'yarn test',
        'pnpm test',
        'pytest',
        'go test ./...',
        'cargo test',
      ];

      let testPassed = false;
      
      for (const command of testCommands) {
        try {
          const [cmd, ...args] = command.split(' ');
          if (!cmd) continue;
          await execa(cmd, args, { 
            stdio: 'pipe',
            timeout: 300000, // 5 minutes timeout
          });
          testPassed = true;
          break;
        } catch (error) {
          // Try next command
          continue;
        }
      }

      if (!testPassed) {
        // Try to detect test files and run them directly
        const hasTests = await this.detectTestFiles();
        if (!hasTests) {
          logger.warn('No tests found, skipping test gate');
          spinner.succeed('Test gate skipped (no tests found)');
          return;
        }
        
        throw new Error('All test commands failed');
      }

      spinner.succeed('Test gate passed');
    } catch (error) {
      spinner.fail('Test gate failed');
      throw new Error(`Tests failed: ${error}`);
    }
  }

  /**
   * Detect if project has test files
   */
  private async detectTestFiles(): Promise<boolean> {
    const testPatterns = [
      '**/*.test.{js,ts,jsx,tsx}',
      '**/*.spec.{js,ts,jsx,tsx}',
      '**/test_*.py',
      '**/*_test.py',
      '**/*Test.java',
      '**/*_test.go',
    ];

    for (const pattern of testPatterns) {
      try {
        const { glob } = await import('glob');
        const files = await glob(pattern, { ignore: 'node_modules/**' });
        if (files.length > 0) {
          return true;
        }
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Apply changes atomically
   */
  private async applyChangesAtomically(changes: ChangeSet[]): Promise<void> {
    // Group changes by file to handle multiple changes to the same file
    const fileChanges = new Map<string, ChangeSet[]>();
    
    changes.forEach(change => {
      const existing = fileChanges.get(change.file) || [];
      existing.push(change);
      fileChanges.set(change.file, existing);
    });

    // Apply changes file by file
    for (const [file, fileChangeList] of fileChanges) {
      await this.applyFileChanges(file, fileChangeList);
    }
  }

  /**
   * Apply changes to a single file
   */
  private async applyFileChanges(file: string, changes: ChangeSet[]): Promise<void> {
    // Sort changes by operation priority (delete, modify, create)
    const sortedChanges = changes.sort((a, b) => {
      const priority = { delete: 0, modify: 1, create: 2 };
      return priority[a.operation] - priority[b.operation];
    });

    for (const change of sortedChanges) {
      switch (change.operation) {
        case 'create':
          if (change.newContent !== undefined) {
            await fs.ensureDir(path.dirname(change.file));
            await fs.writeFile(change.file, change.newContent);
          }
          break;
        
        case 'modify':
          if (change.newContent !== undefined) {
            await fs.writeFile(change.file, change.newContent);
          }
          break;
        
        case 'delete':
          if (await fs.pathExists(change.file)) {
            await fs.remove(change.file);
          }
          break;
      }
    }
  }

  /**
   * Log dry-run changes
   */
  private logDryRunChanges(changes: ChangeSet[]): void {
    this.previewChanges(changes);
  }

  /**
   * Generate simple diff for preview
   */
  private generateSimpleDiff(original: string, modified: string): string[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: string[] = [];

    // Simple line-by-line diff
    const maxLines = Math.max(originalLines.length, modifiedLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];

      if (origLine !== modLine) {
        if (origLine && !modLine) {
          diff.push(`- ${origLine}`);
        } else if (!origLine && modLine) {
          diff.push(`+ ${modLine}`);
        } else if (origLine && modLine) {
          diff.push(`- ${origLine}`);
          diff.push(`+ ${modLine}`);
        }
      }
    }

    return diff;
  }

  /**
   * Log operation to audit trail
   */
  private async logOperation(
    operationId: string,
    changes: ChangeSet[],
    status: 'success' | 'failed'
  ): Promise<void> {
    const auditEntry = {
      operationId,
      timestamp: new Date(),
      status,
      changesCount: changes.length,
      files: changes.map(c => c.file),
    };

    const auditLogPath = '.hydro/logs/audit.log';
    const logLine = JSON.stringify(auditEntry) + '\n';
    
    await fs.appendFile(auditLogPath, logLine);
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `op-${timestamp}-${random}`;
  }

  /**
   * Clean up old operations and backups
   */
  public async cleanup(olderThanDays: number = 7): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    try {
      const backupDirs = await fs.readdir(this.backupDir);
      
      for (const dir of backupDirs) {
        const dirPath = path.join(this.backupDir, dir);
        const manifestPath = path.join(dirPath, 'manifest.json');
        
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readJSON(manifestPath);
          const backupDate = new Date(manifest.timestamp);
          
          if (backupDate < cutoffDate) {
            await fs.remove(dirPath);
            logger.debug(`Cleaned up old backup: ${dir}`);
          }
        }
      }
    } catch (error) {
      logger.debug(`Cleanup failed: ${error}`);
    }
  }

  /**
   * Get operation status
   */
  public getOperation(operationId: string): OperationContext | undefined {
    return this.operations.get(operationId);
  }

  /**
   * List all active operations
   */
  public listOperations(): OperationContext[] {
    return Array.from(this.operations.values());
  }
}
