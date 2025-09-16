/**
 * Base command class for all Hydro CLI commands
 */

import { Command } from 'commander';

import { logger } from '@/core/logger';
import { ConfigManager } from '@/core/config';

import type { CommandOptions, HydroConfig } from '@/types';

export abstract class BaseCommand {
  protected command: Command;
  protected config: HydroConfig | null = null;

  constructor(name: string, description: string) {
    this.command = new Command(name);
    this.command.description(description);
    this.setupCommonOptions();
  }

  /**
   * Setup common options available to all commands
   */
  private setupCommonOptions(): void {
    this.command
      .option('--dry-run', 'Show what would be done without making changes', false)
      .option('--apply', 'Apply changes (required for destructive operations)', false)
      .option('--path <path>', 'Limit operation to specific path')
      .option('--format <format>', 'Output format (json|yaml|csv|dot|graph)', 'json')
      .option('--yes', 'Skip confirmation prompts', false)
      .option('--staged', 'Create staged git changes', false);
  }

  /**
   * Get the commander Command instance
   */
  public getCommand(): Command {
    return this.command;
  }

  /**
   * Load configuration
   */
  protected async loadConfig(): Promise<HydroConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      const configManager = ConfigManager.getInstance();
      this.config = configManager.getConfig();
      return this.config;
    } catch (error) {
      logger.error('Failed to load configuration', error as Error);
      throw new Error('Configuration required. Run "hydro init" first.');
    }
  }

  /**
   * Validate that apply flag is set for destructive operations
   */
  protected validateApplyFlag(options: CommandOptions, operation: string): void {
    if (!options.dryRun && !options.apply) {
      throw new Error(
        `${operation} requires --apply flag. Use --dry-run to preview changes first.`
      );
    }
  }

  /**
   * Check if operation should run in dry-run mode
   */
  protected isDryRun(options: CommandOptions): boolean {
    const config = this.config;
    
    // Explicit dry-run flag takes precedence
    if (options.dryRun) return true;
    
    // If apply is explicitly set, not dry-run
    if (options.apply) return false;
    
    // Use config default
    return config?.safety.dryRunDefault ?? true;
  }

  /**
   * Get target path for operation
   */
  protected getTargetPath(options: CommandOptions): string {
    return options.path || process.cwd();
  }

  /**
   * Ensure output directory exists
   */
  protected async ensureOutputDir(config: HydroConfig): Promise<string> {
    const fs = await import('fs-extra');
    const outputDir = config.outputs.reports;
    await fs.ensureDir(outputDir);
    return outputDir;
  }

  /**
   * Format and save output based on format option
   */
  protected async saveOutput(
    data: unknown,
    filename: string,
    format: string,
    outputDir: string
  ): Promise<string> {
    const fs = await import('fs-extra');
    const path = await import('path');
    
    let content: string;
    let extension: string;

    switch (format.toLowerCase()) {
      case 'yaml':
      case 'yml': {
        const yaml = await import('yaml');
        content = yaml.stringify(data, { indent: 2 });
        extension = 'yml';
        break;
      }
      case 'csv': {
        if (Array.isArray(data)) {
          content = this.arrayToCsv(data);
          extension = 'csv';
        } else {
          throw new Error('CSV format requires array data');
        }
        break;
      }
      case 'json':
      default:
        content = JSON.stringify(data, null, 2);
        extension = 'json';
        break;
    }

    const outputPath = path.join(outputDir, `${filename}.${extension}`);
    await fs.writeFile(outputPath, content, 'utf8');
    
    return outputPath;
  }

  /**
   * Convert array to CSV format
   */
  private arrayToCsv(data: unknown[]): string {
    if (data.length === 0) return '';

    const firstItem = data[0];
    if (typeof firstItem !== 'object' || firstItem === null) {
      throw new Error('CSV format requires array of objects');
    }

    const headers = Object.keys(firstItem as Record<string, unknown>);
    const csvRows = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          const value = (item as Record<string, unknown>)[header];
          const stringValue = String(value ?? '');
          // Escape quotes and wrap in quotes if contains comma or quote
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  /**
   * Display summary table
   */
  protected displaySummary(title: string, data: Record<string, unknown>): void {
    logger.raw(`\n${title}:`);
    logger.raw('─'.repeat(title.length + 1));
    
    Object.entries(data).forEach(([key, value]) => {
      const displayKey = key.replace(/([A-Z])/g, ' $1').toLowerCase();
      const capitalizedKey = displayKey.charAt(0).toUpperCase() + displayKey.slice(1);
      logger.raw(`${capitalizedKey}: ${value}`);
    });
  }

  /**
   * Confirm destructive operation
   */
  protected async confirmOperation(
    message: string,
    options: CommandOptions
  ): Promise<boolean> {
    if (options.yes) return true;
    if (this.isDryRun(options)) return true;

    const inquirer = await import('inquirer');
    const { confirm } = await inquirer.default.prompt<{ confirm: boolean }>([
      {
        type: 'confirm',
        name: 'confirm',
        message,
        default: false,
      },
    ]);

    return confirm;
  }

  /**
   * Abstract method that subclasses must implement
   */
  protected abstract execute(options: CommandOptions): Promise<void>;
}
