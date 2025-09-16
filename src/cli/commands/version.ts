/**
 * Version command - Display Hydro version information
 */

import { BaseCommand } from './base';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class VersionCommand extends BaseCommand {
  constructor() {
    super('version', 'Display Hydro version information');
    
    this.command
      .alias('v')
      .option('--json', 'Output version information as JSON', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      json?: boolean;
    }
  ): Promise<void> {
    try {
      const versionInfo = await this.getVersionInfo();

      if (options.json) {
        logger.raw(JSON.stringify(versionInfo, null, 2));
      } else {
        this.displayVersionInfo(versionInfo);
      }
    } catch (error) {
      logger.error('Failed to get version information', error as Error);
      throw error;
    }
  }

  /**
   * Get comprehensive version information
   */
  private async getVersionInfo(): Promise<VersionInfo> {
    const packageInfo = await this.getPackageInfo();
    const systemInfo = await this.getSystemInfo();
    const gitInfo = await this.getGitInfo();

    return {
      hydro: {
        version: packageInfo.version,
        name: packageInfo.name,
        description: packageInfo.description,
        homepage: packageInfo.homepage,
        repository: packageInfo.repository,
        license: packageInfo.license,
        author: packageInfo.author,
      },
      system: systemInfo,
      git: gitInfo,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get package.json information
   */
  private async getPackageInfo(): Promise<PackageInfo> {
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = await fs.readJson(packagePath);
      
      return {
        version: packageJson.version || '1.0.0',
        name: packageJson.name || 'hydro-cli',
        description: packageJson.description || 'The Unified Development Environment Catalyst',
        homepage: packageJson.homepage || 'https://github.com/hydro-cli/hydro',
        repository: packageJson.repository?.url || 'https://github.com/hydro-cli/hydro.git',
        license: packageJson.license || 'MIT',
        author: packageJson.author || 'Hydro Team',
      };
    } catch (error) {
      logger.debug('Could not read package.json, using defaults');
      return {
        version: '1.0.0',
        name: 'hydro-cli',
        description: 'The Unified Development Environment Catalyst',
        homepage: 'https://github.com/hydro-cli/hydro',
        repository: 'https://github.com/hydro-cli/hydro.git',
        license: 'MIT',
        author: 'Hydro Team',
      };
    }
  }

  /**
   * Get system information
   */
  private async getSystemInfo(): Promise<SystemInfo> {
    const os = await import('os');
    
    return {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      nodePath: process.execPath,
      cwd: process.cwd(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      cpus: os.cpus().length,
      uptime: os.uptime(),
    };
  }

  /**
   * Get Git information
   */
  private async getGitInfo(): Promise<GitInfo> {
    try {
      const { GitUtils } = await import('@/utils/git-utils');
      
      const isGitRepo = await GitUtils.isGitRepository();
      if (!isGitRepo) {
        return { isGitRepository: false };
      }

      const status = await GitUtils.getStatus();
      const branches = await GitUtils.getBranches(true);
      const remoteUrl = await GitUtils.getRemoteUrl();

      return {
        isGitRepository: true,
        currentBranch: status.currentBranch,
        hasUncommittedChanges: status.hasUncommittedChanges,
        uncommittedFiles: status.uncommittedFiles,
        branches: branches.slice(0, 10), // Limit to first 10 branches
        remoteUrl,
      };
    } catch (error) {
      logger.debug('Could not get Git information');
      return { isGitRepository: false };
    }
  }

  /**
   * Display version information in a formatted way
   */
  private displayVersionInfo(info: VersionInfo): void {
    logger.raw('\n🔧 Hydro - The Unified Development Environment Catalyst');
    logger.raw('═'.repeat(60));
    
    // Hydro info
    logger.raw(`\n📦 Version: ${info.hydro.version}`);
    logger.raw(`📝 Description: ${info.hydro.description}`);
    logger.raw(`🏠 Homepage: ${info.hydro.homepage}`);
    logger.raw(`📄 License: ${info.hydro.license}`);
    logger.raw(`👤 Author: ${info.hydro.author}`);

    // System info
    logger.raw('\n💻 System Information:');
    logger.raw(`   Platform: ${info.system.platform} (${info.system.arch})`);
    logger.raw(`   Node.js: ${info.system.nodeVersion}`);
    logger.raw(`   Memory: ${this.formatBytes(info.system.memory.used)} / ${this.formatBytes(info.system.memory.total)}`);
    logger.raw(`   CPUs: ${info.system.cpus}`);
    logger.raw(`   Working Directory: ${info.system.cwd}`);

    // Git info
    if (info.git.isGitRepository) {
      logger.raw('\n📁 Git Repository:');
      logger.raw(`   Current Branch: ${info.git.currentBranch}`);
      logger.raw(`   Uncommitted Changes: ${info.git.hasUncommittedChanges ? 'Yes' : 'No'}`);
      if (info.git.remoteUrl) {
        logger.raw(`   Remote: ${info.git.remoteUrl}`);
      }
      if (info.git.uncommittedFiles && info.git.uncommittedFiles.length > 0) {
        logger.raw(`   Modified Files: ${info.git.uncommittedFiles.length}`);
      }
    } else {
      logger.raw('\n📁 Git Repository: Not a Git repository');
    }

    logger.raw('\n' + '═'.repeat(60));
    logger.raw(`Generated at: ${new Date(info.timestamp).toLocaleString()}\n`);
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

interface VersionInfo {
  hydro: PackageInfo;
  system: SystemInfo;
  git: GitInfo;
  timestamp: string;
}

interface PackageInfo {
  version: string;
  name: string;
  description: string;
  homepage: string;
  repository: string;
  license: string;
  author: string;
}

interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  nodePath: string;
  cwd: string;
  memory: {
    total: number;
    free: number;
    used: number;
  };
  cpus: number;
  uptime: number;
}

interface GitInfo {
  isGitRepository: boolean;
  currentBranch?: string;
  hasUncommittedChanges?: boolean;
  uncommittedFiles?: string[];
  branches?: string[];
  remoteUrl?: string;
}
