/**
 * Centralized logging system for Hydro
 */

import chalk from 'chalk';
import debug from 'debug';
import fs from 'fs-extra';
import path from 'path';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  stack?: string;
}

export class Logger {
  private static instance: Logger;
  private logFile: string | null = null;
  private debugLogger = debug('hydro');
  private entries: LogEntry[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize logger with log file path
   */
  public async initialize(logDir?: string): Promise<void> {
    if (logDir) {
      await fs.ensureDir(logDir);
      this.logFile = path.join(logDir, 'hydro.log');
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
    this.debugLogger(message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
    // eslint-disable-next-line no-console
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Log success message
   */
  public success(message: string, context?: Record<string, unknown>): void {
    this.log('success', message, context);
    // eslint-disable-next-line no-console
    console.log(chalk.green('✓'), message);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
    // eslint-disable-next-line no-console
    console.warn(chalk.yellow('⚠'), message);
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error?.stack);
    // eslint-disable-next-line no-console
    console.error(chalk.red('✗'), message);
    
    if (error && process.env.DEBUG) {
      // eslint-disable-next-line no-console
      console.error(chalk.red(error.stack));
    }
  }

  /**
   * Log raw message without formatting
   */
  public raw(message: string): void {
    // eslint-disable-next-line no-console
    console.log(message);
  }

  /**
   * Create a spinner for long-running operations
   */
  public createSpinner(message: string): {
    start: () => void;
    stop: () => void;
    succeed: (message?: string) => void;
    fail: (message?: string) => void;
    update: (message: string) => void;
  } {
    let isRunning = false;
    let interval: ReturnType<typeof setInterval> | null = null;
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    return {
      start: () => {
        if (isRunning) return;
        isRunning = true;
        process.stdout.write('\x1B[?25l'); // Hide cursor
        interval = setInterval(() => {
          process.stdout.write(`\r${chalk.cyan(frames[frameIndex])} ${message}`);
          frameIndex = (frameIndex + 1) % frames.length;
        }, 80);
      },
      
      stop: () => {
        if (!isRunning) return;
        isRunning = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write('\r\x1B[K'); // Clear line
        process.stdout.write('\x1B[?25h'); // Show cursor
      },
      
      succeed: (successMessage?: string) => {
        if (!isRunning) return;
        isRunning = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write(`\r${chalk.green('✓')} ${successMessage || message}\n`);
        process.stdout.write('\x1B[?25h'); // Show cursor
      },
      
      fail: (errorMessage?: string) => {
        if (!isRunning) return;
        isRunning = false;
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        process.stdout.write(`\r${chalk.red('✗')} ${errorMessage || message}\n`);
        process.stdout.write('\x1B[?25h'); // Show cursor
      },
      
      update: (newMessage: string) => {
        message = newMessage;
      },
    };
  }

  /**
   * Log table data
   */
  public table(data: Record<string, unknown>[]): void {
    if (data.length === 0) return;

    const firstRow = data[0];
    if (!firstRow) return;

    const keys = Object.keys(firstRow);
    const maxWidths = keys.map(key => 
      Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      )
    );

    // Header
    const header = keys
      .map((key, i) => key.padEnd(maxWidths[i] || 0))
      .join(' | ');
    this.raw(chalk.bold(header));
    this.raw(keys.map((_, i) => '-'.repeat(maxWidths[i] || 0)).join('-+-'));

    // Rows
    data.forEach(row => {
      const rowStr = keys
        .map((key, i) => String(row[key] || '').padEnd(maxWidths[i] || 0))
        .join(' | ');
      this.raw(rowStr);
    });
  }

  /**
   * Internal logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    stack?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context: context || {},
      stack: stack || '',
    };

    this.entries.push(entry);

    // Write to file if configured
    if (this.logFile) {
      this.writeToFile(entry).catch(err => {
        // eslint-disable-next-line no-console
        console.error('Failed to write to log file:', err);
      });
    }
  }

  /**
   * Write log entry to file
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.logFile) return;

    const logLine = JSON.stringify({
      ...entry,
      timestamp: entry.timestamp.toISOString(),
    }) + '\n';

    await fs.appendFile(this.logFile, logLine);
  }

  /**
   * Get all log entries
   */
  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Clear log entries
   */
  public clear(): void {
    this.entries = [];
  }

  /**
   * Export logs to file
   */
  public async exportLogs(filePath: string, format: 'json' | 'text' = 'json'): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));

    if (format === 'json') {
      await fs.writeJSON(filePath, this.entries, { spaces: 2 });
    } else {
      const textLogs = this.entries
        .map(entry => 
          `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`
        )
        .join('\n');
      await fs.writeFile(filePath, textLogs);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
