/**
 * Enhanced progress tracking for bulk operations
 */

import { logger } from '@/core/logger';

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  batchProgress: number;
  estimatedTimeRemaining: number;
  processingRate: number; // items per second
  memoryUsage: string;
  startTime: number;
  lastUpdateTime: number;
}

export interface ProgressCallback {
  (info: ProgressInfo): void;
}

export class ProgressTracker {
  private startTime: number;
  private lastUpdateTime: number;
  private lastProcessedCount: number;
  private processingRates: number[] = [];
  private readonly maxRateHistory = 10;
  private callback?: ProgressCallback;
  private updateInterval: number = 1000; // Update every 1 second
  private lastCallbackTime: number = 0;

  constructor(
    private total: number,
    private totalBatches: number,
    callback?: ProgressCallback,
    updateInterval: number = 1000
  ) {
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.lastProcessedCount = 0;
    this.callback = callback!;
    this.updateInterval = updateInterval;
  }

  /**
   * Update progress
   */
  public update(current: number, currentBatch: number): void {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // Calculate processing rate
    const itemsProcessed = current - this.lastProcessedCount;
    const currentRate = itemsProcessed / (timeSinceLastUpdate / 1000);
    
    // Add to rate history
    this.processingRates.push(currentRate);
    if (this.processingRates.length > this.maxRateHistory) {
      this.processingRates.shift();
    }
    
    // Calculate average processing rate
    const averageRate = this.processingRates.reduce((sum, rate) => sum + rate, 0) / this.processingRates.length;
    
    // Calculate estimated time remaining
    const remaining = this.total - current;
    const estimatedTimeRemaining = averageRate > 0 ? (remaining / averageRate) * 1000 : 0;
    
    // Calculate batch progress
    const batchProgress = this.totalBatches > 0 ? (currentBatch / this.totalBatches) * 100 : 0;
    
    // Get memory usage
    const memoryUsage = this.getMemoryUsage();
    
    const progressInfo: ProgressInfo = {
      current,
      total: this.total,
      percentage: (current / this.total) * 100,
      currentBatch,
      totalBatches: this.totalBatches,
      batchProgress,
      estimatedTimeRemaining,
      processingRate: averageRate,
      memoryUsage,
      startTime: this.startTime,
      lastUpdateTime: now
    };
    
    // Update internal state
    this.lastUpdateTime = now;
    this.lastProcessedCount = current;
    
    // Call callback if enough time has passed
    if (this.callback && (now - this.lastCallbackTime) >= this.updateInterval) {
      this.callback(progressInfo);
      this.lastCallbackTime = now;
    }
  }

  /**
   * Complete the progress tracking
   */
  public complete(): ProgressInfo {
    const now = Date.now();
    const totalDuration = now - this.startTime;
    
    const finalInfo: ProgressInfo = {
      current: this.total,
      total: this.total,
      percentage: 100,
      currentBatch: this.totalBatches,
      totalBatches: this.totalBatches,
      batchProgress: 100,
      estimatedTimeRemaining: 0,
      processingRate: this.total / (totalDuration / 1000),
      memoryUsage: this.getMemoryUsage(),
      startTime: this.startTime,
      lastUpdateTime: now
    };
    
    if (this.callback) {
      this.callback(finalInfo);
    }
    
    return finalInfo;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): string {
    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = (used / total) * 100;
    
    return `${this.formatBytes(used)} / ${this.formatBytes(total)} (${percentage.toFixed(1)}%)`;
  }

  /**
   * Get detailed memory usage information
   */
  public getDetailedMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    formatted: string;
    percentage: number;
  } {
    const usage = process.memoryUsage();
    const percentage = (usage.heapUsed / usage.heapTotal) * 100;
    
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      formatted: this.getMemoryUsage(),
      percentage
    };
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
}

/**
 * Progress display utilities
 */
export class ProgressDisplay {
  /**
   * Create a progress bar string
   */
  public static createProgressBar(
    current: number,
    total: number,
    width: number = 30,
    fillChar: string = '█',
    emptyChar: string = '░'
  ): string {
    const percentage = total > 0 ? current / total : 0;
    const filled = Math.floor(percentage * width);
    const empty = width - filled;
    
    return `[${fillChar.repeat(filled)}${emptyChar.repeat(empty)}] ${(percentage * 100).toFixed(1)}%`;
  }

  /**
   * Format time duration
   */
  public static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Format processing rate
   */
  public static formatRate(rate: number): string {
    if (rate >= 1000) {
      return `${(rate / 1000).toFixed(1)}k/s`;
    } else {
      return `${rate.toFixed(1)}/s`;
    }
  }

  /**
   * Create a detailed progress display
   */
  public static createDetailedDisplay(info: ProgressInfo): string {
    const progressBar = this.createProgressBar(info.current, info.total);
    const timeRemaining = this.formatDuration(info.estimatedTimeRemaining);
    const rate = this.formatRate(info.processingRate);
    
    return [
      `Progress: ${progressBar}`,
      `Items: ${info.current}/${info.total} (${info.percentage.toFixed(1)}%)`,
      `Batches: ${info.currentBatch}/${info.totalBatches}`,
      `Rate: ${rate}`,
      `ETA: ${timeRemaining}`,
      `Memory: ${info.memoryUsage}`
    ].join(' | ');
  }
}
