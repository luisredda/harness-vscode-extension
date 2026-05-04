// Logger utility with configurable log levels
// Respects harness.logLevel setting from VS Code configuration

import * as vscode from 'vscode';

export enum LogLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  off: LogLevel.OFF,
  error: LogLevel.ERROR,
  warn: LogLevel.WARN,
  info: LogLevel.INFO,
  debug: LogLevel.DEBUG,
};

class Logger {
  private getCurrentLevel(): LogLevel {
    const config = vscode.workspace.getConfiguration('harness');
    const levelStr = config.get<string>('logLevel', 'info');
    return LOG_LEVEL_MAP[levelStr] ?? LogLevel.INFO;
  }

  /**
   * Log an error message (always shown unless logLevel is 'off')
   */
  error(prefix: string, ...args: any[]): void {
    if (this.getCurrentLevel() >= LogLevel.ERROR) {
      console.error(`[${prefix}]`, ...args);
    }
  }

  /**
   * Log a warning message (shown when logLevel is 'warn', 'info', or 'debug')
   */
  warn(prefix: string, ...args: any[]): void {
    if (this.getCurrentLevel() >= LogLevel.WARN) {
      console.warn(`[${prefix}]`, ...args);
    }
  }

  /**
   * Log an info message (shown when logLevel is 'info' or 'debug')
   */
  info(prefix: string, ...args: any[]): void {
    if (this.getCurrentLevel() >= LogLevel.INFO) {
      console.log(`[${prefix}]`, ...args);
    }
  }

  /**
   * Log a debug message (only shown when logLevel is 'debug')
   */
  debug(prefix: string, ...args: any[]): void {
    if (this.getCurrentLevel() >= LogLevel.DEBUG) {
      console.log(`[${prefix}]`, ...args);
    }
  }

  /**
   * Log a message at any level (bypass filtering - use sparingly)
   */
  always(prefix: string, ...args: any[]): void {
    console.log(`[${prefix}]`, ...args);
  }
}

// Singleton logger instance
export const logger = new Logger();
