/**
 * Update command - Update Hydro to the latest version
 */

import { execa } from 'execa';
import { BaseCommand } from './base';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class UpdateCommand extends BaseCommand {
  constructor() {
    super('update', 'Update Hydro to the latest version');
    
    this.command
      .option('--check', 'Check for updates without installing', false)
      .option('--force', 'Force update even if already latest', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      check?: boolean;
      force?: boolean;
    }
  ): Promise<void> {
    const spinner = logger.createSpinner('Checking for updates...');
    spinner.start();

    try {
      // Check current version
      const currentVersion = await this.getCurrentVersion();
      logger.info(`Current version: ${currentVersion}`);

      if (options.check) {
        const latestVersion = await this.getLatestVersion();
        const isUpToDate = this.compareVersions(currentVersion, latestVersion) >= 0;
        
        spinner.succeed('Update check complete');
        
        if (isUpToDate) {
          logger.success(`You're already running the latest version: ${currentVersion}`);
        } else {
          logger.info(`Update available: ${latestVersion}`);
          logger.info(`Current version: ${currentVersion}`);
          logger.info('Run "hydro update" to install the latest version');
        }
        return;
      }

      // Get latest version
      const latestVersion = await this.getLatestVersion();
      const isUpToDate = this.compareVersions(currentVersion, latestVersion) >= 0;

      if (isUpToDate && !options.force) {
        spinner.succeed('Already up to date');
        logger.success(`You're already running the latest version: ${currentVersion}`);
        return;
      }

      // Perform update
      spinner.update('Installing latest version...');
      await this.performUpdate();

      spinner.succeed('Update completed successfully');
      logger.success('Hydro has been updated to the latest version');
      logger.info('Restart your terminal or run "hydro --version" to verify');

    } catch (error) {
      spinner.fail('Update failed');
      throw error;
    }
  }

  /**
   * Get current version from package.json
   */
  private async getCurrentVersion(): Promise<string> {
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = await fs.readJson(packagePath);
      
      return packageJson.version || '1.0.0';
    } catch (error) {
      logger.debug('Could not read package.json, using default version');
      return '1.0.0';
    }
  }

  /**
   * Get latest version from npm registry
   */
  private async getLatestVersion(): Promise<string> {
    try {
      const { stdout } = await execa('npm', ['view', 'hydro-cli', 'version'], { stdio: 'pipe' });
      return stdout.trim();
    } catch (error) {
      // Fallback: try to get from GitHub releases
      try {
        const { stdout } = await execa('curl', ['-s', 'https://api.github.com/repos/hydro-cli/hydro/releases/latest'], { stdio: 'pipe' });
        const release = JSON.parse(stdout);
        return release.tag_name.replace('v', '');
      } catch {
        throw new Error('Could not determine latest version. Please check your internet connection.');
      }
    }
  }

  /**
   * Compare two semantic versions
   */
  private compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * Perform the actual update
   */
  private async performUpdate(): Promise<void> {
    try {
      // Try npm first
      await execa('npm', ['install', '-g', 'hydro-cli@latest'], { stdio: 'pipe' });
    } catch (error) {
      // Fallback to yarn
      try {
        await execa('yarn', ['global', 'add', 'hydro-cli@latest'], { stdio: 'pipe' });
      } catch (yarnError) {
        // Fallback to pnpm
        try {
          await execa('pnpm', ['add', '-g', 'hydro-cli@latest'], { stdio: 'pipe' });
        } catch (pnpmError) {
          throw new Error('Failed to update Hydro. Please install manually: npm install -g hydro-cli@latest');
        }
      }
    }
  }
}
