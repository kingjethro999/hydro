/**
 * Centralized error handling utilities for Hydro
 */

import { logger } from '@/core/logger';

export interface HydroError extends Error {
  code?: string;
  context?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  recoverable?: boolean;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorCounts = new Map<string, number>();
  private readonly MAX_ERRORS_PER_TYPE = 10;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors with context
   */
  public handleError(
    error: Error | HydroError,
    context?: Record<string, unknown>,
    options?: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      recoverable?: boolean;
      code?: string;
    }
  ): void {
    const hydroError = this.normalizeError(error, context, options);
    
    // Track error frequency
    const errorKey = hydroError.code || hydroError.name;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    // Suppress repeated errors
    if (count >= this.MAX_ERRORS_PER_TYPE) {
      if (count === this.MAX_ERRORS_PER_TYPE) {
        logger.warn(`Suppressing further ${errorKey} errors (max ${this.MAX_ERRORS_PER_TYPE} reached)`);
      }
      return;
    }

    // Log based on severity
    switch (hydroError.severity) {
      case 'critical':
        logger.error(hydroError.message, hydroError, {
          ...hydroError.context,
          code: hydroError.code,
          severity: hydroError.severity,
        });
        break;
      case 'high':
        logger.error(hydroError.message, hydroError, {
          ...hydroError.context,
          code: hydroError.code,
          severity: hydroError.severity,
        });
        break;
      case 'medium':
        logger.warn(hydroError.message, {
          ...hydroError.context,
          code: hydroError.code,
          severity: hydroError.severity,
        });
        break;
      case 'low':
      default:
        logger.debug(hydroError.message, {
          ...hydroError.context,
          code: hydroError.code,
          severity: hydroError.severity,
        });
        break;
    }
  }

  /**
   * Wrap async functions with error handling
   */
  public async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
    options?: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      recoverable?: boolean;
      code?: string;
      fallback?: T;
    }
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error as Error, context, options);
      return options?.fallback;
    }
  }

  /**
   * Wrap sync functions with error handling
   */
  public withSyncErrorHandling<T>(
    fn: () => T,
    context?: Record<string, unknown>,
    options?: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      recoverable?: boolean;
      code?: string;
      fallback?: T;
    }
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      this.handleError(error as Error, context, options);
      return options?.fallback;
    }
  }

  /**
   * Create a recoverable error
   */
  public createRecoverableError(
    message: string,
    code?: string,
    context?: Record<string, unknown>
  ): HydroError {
    const error = new Error(message) as HydroError;
    if (code) error.code = code;
    if (context) error.context = context;
    error.severity = 'medium';
    error.recoverable = true;
    return error;
  }

  /**
   * Create a critical error
   */
  public createCriticalError(
    message: string,
    code?: string,
    context?: Record<string, unknown>
  ): HydroError {
    const error = new Error(message) as HydroError;
    if (code) error.code = code;
    if (context) error.context = context;
    error.severity = 'critical';
    error.recoverable = false;
    return error;
  }

  /**
   * Check if error is recoverable
   */
  public isRecoverable(error: Error | HydroError): boolean {
    const hydroError = error as HydroError;
    return hydroError.recoverable !== false;
  }

  /**
   * Get error statistics
   */
  public getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Reset error counts
   */
  public resetErrorCounts(): void {
    this.errorCounts.clear();
  }

  /**
   * Normalize error to HydroError format
   */
  private normalizeError(
    error: Error | HydroError,
    context?: Record<string, unknown>,
    options?: {
      severity?: 'low' | 'medium' | 'high' | 'critical';
      recoverable?: boolean;
      code?: string;
    }
  ): HydroError {
    const hydroError = error as HydroError;
    
    const normalizedError: HydroError = {
      ...hydroError,
      context: { ...hydroError.context, ...context },
      severity: options?.severity || hydroError.severity || 'medium',
      recoverable: options?.recoverable !== undefined ? options.recoverable : hydroError.recoverable !== false,
    };
    
    const code = options?.code || hydroError.code;
    if (code) {
      normalizedError.code = code;
    }
    
    return normalizedError;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Common error codes
export const ERROR_CODES = {
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Utility functions for common error scenarios
export const createFileNotFoundError = (filePath: string): HydroError => {
  return errorHandler.createRecoverableError(
    `File not found: ${filePath}`,
    ERROR_CODES.FILE_NOT_FOUND,
    { filePath }
  );
};

export const createPermissionError = (operation: string, resource: string): HydroError => {
  return errorHandler.createCriticalError(
    `Permission denied: ${operation} on ${resource}`,
    ERROR_CODES.PERMISSION_DENIED,
    { operation, resource }
  );
};

export const createConfigError = (message: string, configPath?: string): HydroError => {
  return errorHandler.createCriticalError(
    `Configuration error: ${message}`,
    ERROR_CODES.INVALID_CONFIG,
    { configPath }
  );
};

export const createNetworkError = (url: string, status?: number): HydroError => {
  return errorHandler.createRecoverableError(
    `Network error: ${url}${status ? ` (${status})` : ''}`,
    ERROR_CODES.NETWORK_ERROR,
    { url, status }
  );
};

export const createParsingError = (filePath: string, reason: string): HydroError => {
  return errorHandler.createRecoverableError(
    `Failed to parse ${filePath}: ${reason}`,
    ERROR_CODES.PARSING_ERROR,
    { filePath, reason }
  );
};
