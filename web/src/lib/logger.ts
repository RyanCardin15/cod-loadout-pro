/**
 * Production-ready logging utility
 *
 * Features:
 * - Environment-aware logging (verbose in dev, minimal in prod)
 * - Structured logging with context
 * - Log levels: debug, info, warn, error
 * - Performance timing utilities
 * - Safe error serialization
 *
 * @example
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Database error', { error, query });
 *
 * const timer = logger.time('api-call');
 * await fetch('/api/data');
 * timer.end();
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Format and serialize an error object safely
   */
  private serializeError(error: unknown): LogEntry['error'] {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
        name: error.name,
      };
    }

    if (typeof error === 'string') {
      return { message: error };
    }

    return {
      message: String(error),
    };
  }

  /**
   * Create a structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    if (context) {
      // Separate error from other context
      const { error, ...restContext } = context;

      if (error) {
        entry.error = this.serializeError(error);
      }

      if (Object.keys(restContext).length > 0) {
        entry.context = restContext;
      }
    }

    return entry;
  }

  /**
   * Format log entry for console output
   */
  private formatForConsole(entry: LogEntry): string {
    const parts = [`[${entry.level.toUpperCase()}]`, entry.message];

    if (entry.context) {
      parts.push(JSON.stringify(entry.context, null, this.isDevelopment ? 2 : 0));
    }

    if (entry.error) {
      parts.push(`Error: ${entry.error.message}`);
      if (entry.error.stack && this.isDevelopment) {
        parts.push(`\nStack: ${entry.error.stack}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * Output log entry to appropriate destination
   */
  private output(entry: LogEntry): void {
    const formatted = this.formatForConsole(entry);

    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formatted);
        }
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }

    // In production, you could send to external logging service here
    // if (this.isProduction) {
    //   sendToLogService(entry);
    // }
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isDevelopment) return;
    const entry = this.createLogEntry('debug', message, context);
    this.output(entry);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    this.output(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    this.output(entry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context);
    this.output(entry);
  }

  /**
   * Create a timer for performance monitoring
   *
   * @example
   * const timer = logger.time('database-query');
   * await db.query('SELECT * FROM users');
   * timer.end(); // Logs: "database-query completed in 45ms"
   */
  time(label: string): { end: () => void } {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.debug(`${label} completed in ${duration.toFixed(2)}ms`, {
          label,
          duration,
        });
      },
    };
  }

  /**
   * Log API request/response
   */
  api(method: string, url: string, context?: LogContext): void {
    this.info(`API ${method} ${url}`, {
      method,
      url,
      ...context,
    });
  }

  /**
   * Log API error
   */
  apiError(method: string, url: string, error: unknown, context?: LogContext): void {
    this.error(`API ${method} ${url} failed`, {
      method,
      url,
      error,
      ...context,
    });
  }

  /**
   * Log component lifecycle event (development only)
   */
  component(name: string, event: 'mount' | 'unmount' | 'update', context?: LogContext): void {
    this.debug(`Component ${name} ${event}`, {
      component: name,
      event,
      ...context,
    });
  }

  /**
   * Log Firebase operation
   */
  firebase(operation: string, collection?: string, context?: LogContext): void {
    this.debug(`Firebase ${operation}`, {
      operation,
      collection,
      ...context,
    });
  }

  /**
   * Log Firebase error
   */
  firebaseError(operation: string, error: unknown, context?: LogContext): void {
    this.error(`Firebase ${operation} failed`, {
      operation,
      error,
      ...context,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for consumers who need it
export type { LogContext };
