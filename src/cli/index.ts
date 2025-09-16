#!/usr/bin/env node

/**
 * Hydro CLI Entry Point
 */

import { Command } from 'commander';

import { logger } from '@/core/logger';
import { ConfigManager } from '@/core/config';

import { AICommand } from './commands/ai';
import { AnalyzeCommand } from './commands/analyze';
import { CodeMapCommand } from './commands/codemap';
import { GenerateCommand } from './commands/generate';
import { InfoCommand } from './commands/info';
import { InitCommand } from './commands/init';
import { PluginCommand } from './commands/plugin';
import { ScanCommand } from './commands/scan';
import { UpdateCommand } from './commands/update';
import { VersionCommand } from './commands/version';
import { WebCommand } from './commands/web';
import { WriteCommand } from './commands/write';

const program = new Command();

async function main(): Promise<void> {
  try {
    // Initialize logger
    await logger.initialize('.hydro/logs');

    program
      .name('hydro')
      .description('The Unified Development Environment Catalyst')
      .version('1.0.0')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('-q, --quiet', 'Suppress non-essential output')
      .option('--config <path>', 'Path to configuration file')
      .hook('preAction', async (thisCommand) => {
        const options = thisCommand.opts();
        
        if (options.verbose) {
          process.env.DEBUG = 'hydro*';
        }

        // Load configuration
        try {
          const configManager = ConfigManager.getInstance();
          await configManager.loadConfig(options.config);
        } catch (error) {
          if (thisCommand.name() !== 'init') {
            logger.warn('No configuration found. Run "hydro init" to create one.');
          }
        }
      });

    // Register commands
    program.addCommand(new InitCommand().getCommand());
    program.addCommand(new ScanCommand().getCommand());
    program.addCommand(new AnalyzeCommand().getCommand());
    program.addCommand(new CodeMapCommand().getCommand());
    program.addCommand(new GenerateCommand().getCommand());
    program.addCommand(new WriteCommand().getCommand());
  program.addCommand(new AICommand().getCommand());
  program.addCommand(new PluginCommand().getCommand());
  program.addCommand(new WebCommand().getCommand());
  program.addCommand(new UpdateCommand().getCommand());
    program.addCommand(new VersionCommand().getCommand());
    program.addCommand(new InfoCommand().getCommand());

    // Global error handler
    program.exitOverride((err) => {
      if (err.code === 'commander.help') {
        process.exit(0);
      }
      if (err.code === 'commander.version') {
        process.exit(0);
      }
      logger.error('Command failed', err);
      process.exit(1);
    });

    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error('Fatal error', error as Error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', reason as Error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start Hydro CLI', error);
    process.exit(1);
  });
}
