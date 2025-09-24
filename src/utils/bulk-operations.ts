/**
 * Bulk operations utilities for optimized large-scale processing
 */

import { logger } from '@/core/logger';

export interface BulkOperationOptions {
  batchSize?: number;
  maxConcurrency?: number;
  enableMemoryManagement?: boolean;
  progressCallback?: (processed: number, total: number, currentBatch: number, totalBatches: number) => void;
}

export interface BulkOperationResult<T> {
  results: T[];
  errors: Array<{ item: any; error: Error }>;
  processed: number;
  total: number;
  duration: number;
}

export class BulkOperations {
  private static readonly DEFAULT_BATCH_SIZE = 100;
  private static readonly DEFAULT_MAX_CONCURRENCY = 10;
  private static readonly MEMORY_GC_INTERVAL = 5; // Force GC every N batches

  /**
   * Process items in optimized batches with concurrency control
   */
  public static async processBulk<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BulkOperationOptions = {}
  ): Promise<BulkOperationResult<R>> {
    const startTime = Date.now();
    const {
      batchSize = this.DEFAULT_BATCH_SIZE,
      maxConcurrency = this.DEFAULT_MAX_CONCURRENCY,
      enableMemoryManagement = true,
      progressCallback
    } = options;

    const results: R[] = [];
    const errors: Array<{ item: T; error: Error }> = [];
    let processed = 0;

    // Create batches
    const batches = this.createBatches(items, batchSize);
    const totalBatches = batches.length;

    logger.debug(`Processing ${items.length} items in ${totalBatches} batches (batch size: ${batchSize})`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      // Process batch with concurrency control
      const batchResults = await this.processBatchWithConcurrency(
        batch!,
        processor,
        maxConcurrency
      );

      // Collect results and errors
      for (const result of batchResults) {
        if (result.success) {
          results.push(result.result!);
        } else {
          errors.push({ item: result.item, error: result.error! });
        }
        processed++;
      }

      // Update progress
      if (progressCallback) {
        progressCallback(processed, items.length, batchIndex + 1, totalBatches);
      }

      // Memory management
      if (enableMemoryManagement && (batchIndex + 1) % this.MEMORY_GC_INTERVAL === 0) {
        if (global.gc) {
          global.gc();
        }
      }
    }

    const duration = Date.now() - startTime;
    logger.debug(`Bulk processing completed: ${processed}/${items.length} items in ${duration}ms`);

    return {
      results,
      errors,
      processed,
      total: items.length,
      duration
    };
  }

  /**
   * Process a single batch with controlled concurrency
   */
  private static async processBatchWithConcurrency<T, R>(
    batch: T[],
    processor: (item: T) => Promise<R>,
    maxConcurrency: number
  ): Promise<Array<{ success: boolean; result?: R; error?: Error; item: T }>> {
    const results: Array<{ success: boolean; result?: R; error?: Error; item: T }> = [];

    // Process items in smaller chunks to control concurrency
    for (let i = 0; i < batch.length; i += maxConcurrency) {
      const chunk = batch.slice(i, i + maxConcurrency);
      
      const chunkPromises = chunk.map(async (item) => {
        try {
          const result = await processor(item);
          return { success: true, result, item };
        } catch (error) {
          return { success: false, error: error as Error, item };
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Create batches from an array
   */
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Process files with streaming for large files
   */
  public static async processFilesWithStreaming<T>(
    files: T[],
    processor: (file: T) => Promise<any>,
    options: BulkOperationOptions & { 
      largeFileThreshold?: number;
      streamProcessor?: (file: T) => Promise<any>;
    } = {}
  ): Promise<BulkOperationResult<any>> {
    const { largeFileThreshold = 1024 * 1024, streamProcessor } = options;
    
    // Separate large and small files
    const smallFiles: T[] = [];
    const largeFiles: T[] = [];
    
    // Note: This is a simplified approach. In a real implementation,
    // you'd check file sizes here
    const allFiles = files;
    
    // Process small files normally
    const smallFileResults = await this.processBulk(
      allFiles,
      processor,
      options
    );
    
    // Process large files with streaming if streamProcessor is provided
    let largeFileResults: BulkOperationResult<any> = {
      results: [],
      errors: [],
      processed: 0,
      total: 0,
      duration: 0
    };
    
    if (streamProcessor && largeFiles.length > 0) {
      largeFileResults = await this.processBulk(
        largeFiles,
        streamProcessor,
        { ...options, batchSize: Math.max(1, Math.floor(options.batchSize || this.DEFAULT_BATCH_SIZE / 4)) }
      );
    }
    
    // Combine results
    return {
      results: [...smallFileResults.results, ...largeFileResults.results],
      errors: [...smallFileResults.errors, ...largeFileResults.errors],
      processed: smallFileResults.processed + largeFileResults.processed,
      total: smallFileResults.total + largeFileResults.total,
      duration: smallFileResults.duration + largeFileResults.duration
    };
  }

  /**
   * Memory usage monitoring
   */
  public static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
    formatted: string;
  } {
    const usage = process.memoryUsage();
    const used = usage.heapUsed;
    const total = usage.heapTotal;
    const percentage = (used / total) * 100;
    
    return {
      used,
      total,
      percentage,
      formatted: `${this.formatBytes(used)} / ${this.formatBytes(total)} (${percentage.toFixed(1)}%)`
    };
  }

  /**
   * Format bytes to human readable string
   */
  private static formatBytes(bytes: number): string {
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
   * Adaptive batch sizing based on memory usage and performance
   */
  public static calculateOptimalBatchSize(
    totalItems: number,
    averageItemSize: number = 1024,
    availableMemory: number = 100 * 1024 * 1024 // 100MB default
  ): number {
    // Calculate batch size based on available memory
    const memoryBasedBatchSize = Math.floor(availableMemory / (averageItemSize * 2)); // 2x safety factor
    
    // Calculate batch size based on total items (don't want too many batches)
    const itemBasedBatchSize = Math.max(50, Math.floor(totalItems / 10));
    
    // Use the smaller of the two, but ensure it's within reasonable bounds
    const optimalBatchSize = Math.min(memoryBasedBatchSize, itemBasedBatchSize);
    
    return Math.max(10, Math.min(optimalBatchSize, 500)); // Between 10 and 500
  }
}
