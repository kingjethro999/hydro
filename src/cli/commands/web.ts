/**
 * Web command - Start the Hydro web interface
 */

import { spawn } from 'child_process';
import path from 'path';
import { BaseCommand } from './base';
import { logger } from '@/core/logger';

import type { CommandOptions } from '@/types';

export class WebCommand extends BaseCommand {
  constructor() {
    super('web', 'Start the Hydro web interface (automatically installs dependencies)');
    
    this.command
      .option('--port <port>', 'Port to run the web server on', '3000')
      .option('--host <host>', 'Host to bind the web server to', 'localhost')
      .option('--open', 'Open the web interface in browser', false)
      .option('--skip-install', 'Skip npm install (assume dependencies are already installed)', false)
      .option('--force-install', 'Force npm install even if node_modules exists', false)
      .action(async (options) => {
        await this.execute(options);
      });
  }

  protected async execute(
    options: CommandOptions & {
      port?: string;
      host?: string;
      open?: boolean;
      skipInstall?: boolean;
      forceInstall?: boolean;
    }
  ): Promise<void> {
    const port = options.port || '3000';
    const host = options.host || 'localhost';
    const shouldOpen = options.open || false;
    const skipInstall = options.skipInstall || false;
    const forceInstall = options.forceInstall || false;

    logger.info('🚀 Starting Hydro Web Interface...');
    logger.info(`📡 Server will run on http://${host}:${port}`);

    try {
      const webDir = path.join(process.cwd(), 'src', 'web');
      
      // First, ensure dependencies are installed (unless skipped)
      if (!skipInstall) {
        await this.ensureDependencies(webDir, forceInstall);
      } else {
        logger.info('⏭️  Skipping dependency installation');
      }
      
      // Set environment variables for the web server
      process.env.PORT = port;
      process.env.HOST = host;

      // Start the web server using npm start
      const serverProcess = spawn('npm', ['start'], {
        cwd: webDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          PORT: port,
          HOST: host
        }
      });

      // Handle server process events
      serverProcess.on('error', (error) => {
        logger.error('Failed to start web server:', error);
        process.exit(1);
      });

      serverProcess.on('exit', (code) => {
        if (code !== 0) {
          logger.error(`Web server exited with code ${code}`);
          process.exit(code || 1);
        }
      });

      // Open browser if requested
      if (shouldOpen) {
        setTimeout(() => {
          const { exec } = require('child_process');
          const url = `http://${host}:${port}`;
          
          const command = process.platform === 'win32' 
            ? `start ${url}`
            : process.platform === 'darwin'
            ? `open ${url}`
            : `xdg-open ${url}`;
            
          exec(command, (error: any) => {
            if (error) {
              logger.warn('Could not open browser automatically');
              logger.info(`Please open http://${host}:${port} in your browser`);
            } else {
              logger.info(`🌐 Opened http://${host}:${port} in your browser`);
            }
          });
        }, 2000);
      }

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        logger.info('\n🛑 Shutting down web server...');
        serverProcess.kill('SIGINT');
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        logger.info('\n🛑 Shutting down web server...');
        serverProcess.kill('SIGTERM');
        process.exit(0);
      });

    } catch (error) {
      logger.error('Failed to start web interface:', error as Error);
      process.exit(1);
    }
  }

  /**
   * Ensure dependencies are installed in the web directory
   */
  private async ensureDependencies(webDir: string, forceInstall: boolean = false): Promise<void> {
    const fs = await import('fs-extra');
    const packageJsonPath = path.join(webDir, 'package.json');
    const nodeModulesPath = path.join(webDir, 'node_modules');

    // Check if package.json exists
    if (!await fs.pathExists(packageJsonPath)) {
      logger.error('package.json not found in web directory');
      throw new Error('Web directory is missing package.json');
    }

    // Force install if requested
    if (forceInstall) {
      logger.info('📦 Force installing web dependencies...');
      await this.runNpmInstall(webDir);
      return;
    }

    // Check if node_modules exists
    const nodeModulesExists = await fs.pathExists(nodeModulesPath);
    
    if (!nodeModulesExists) {
      logger.info('📦 Installing web dependencies...');
      await this.runNpmInstall(webDir);
    } else {
      // Check if package-lock.json exists and is newer than node_modules
      const packageLockPath = path.join(webDir, 'package-lock.json');
      const packageLockExists = await fs.pathExists(packageLockPath);
      
      if (packageLockExists) {
        const packageStats = await fs.stat(packageJsonPath);
        const nodeModulesStats = await fs.stat(nodeModulesPath);
        
        // If package.json is newer than node_modules, reinstall
        if (packageStats.mtime > nodeModulesStats.mtime) {
          logger.info('📦 Dependencies outdated, reinstalling...');
          await this.runNpmInstall(webDir);
        } else {
          logger.info('✅ Dependencies are up to date');
        }
      } else {
        logger.info('📦 Installing web dependencies...');
        await this.runNpmInstall(webDir);
      }
    }
  }

  /**
   * Run npm install in the specified directory
   */
  private async runNpmInstall(webDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const installProcess = spawn('npm', ['install'], {
        cwd: webDir,
        stdio: 'inherit'
      });

      installProcess.on('error', (error) => {
        logger.error('Failed to install dependencies:', error);
        reject(error);
      });

      installProcess.on('exit', (code) => {
        if (code === 0) {
          logger.success('✅ Dependencies installed successfully');
          resolve();
        } else {
          logger.error(`npm install failed with code ${code}`);
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }
}
