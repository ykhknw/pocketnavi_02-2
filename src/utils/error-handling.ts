/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * APIエラークラス
 */
export class APIError extends AppError {
  constructor(
    message: string,
    public endpoint: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}

/**
 * 検証エラークラス
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    public field: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * データベースエラークラス
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public operation: string,
    details?: Record<string, unknown>
  ) {
    super(message, 'DATABASE_ERROR', 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * エラーハンドリングユーティリティ
 */
export class ErrorHandler {
  /**
   * エラーを安全に処理
   */
  static handleError(error: unknown, context?: string): void {
    if (error instanceof AppError) {
      console.error(`[${context || 'App'}] ${error.name}:`, {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details
      });
    } else if (error instanceof Error) {
      console.error(`[${context || 'App'}] Error:`, {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error(`[${context || 'App'}] Unknown error:`, error);
    }
  }

  /**
   * 非同期関数を安全に実行
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error, context);
      return null;
    }
  }

  /**
   * 同期的な関数を安全に実行
   */
  static safeExecuteSync<T>(
    fn: () => T,
    context?: string
  ): T | null {
    try {
      return fn();
    } catch (error) {
      this.handleError(error, context);
      return null;
    }
  }

  /**
   * APIエラーを作成
   */
  static createAPIError(
    message: string,
    endpoint: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ): APIError {
    return new APIError(message, endpoint, statusCode, details);
  }

  /**
   * 検証エラーを作成
   */
  static createValidationError(
    message: string,
    field: string,
    details?: Record<string, unknown>
  ): ValidationError {
    return new ValidationError(message, field, details);
  }

  /**
   * データベースエラーを作成
   */
  static createDatabaseError(
    message: string,
    operation: string,
    details?: Record<string, unknown>
  ): DatabaseError {
    return new DatabaseError(message, operation, details);
  }

  /**
   * エラーがAppErrorかどうかをチェック
   */
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }

  /**
   * エラーがAPIErrorかどうかをチェック
   */
  static isAPIError(error: unknown): error is APIError {
    return error instanceof APIError;
  }

  /**
   * エラーがValidationErrorかどうかをチェック
   */
  static isValidationError(error: unknown): error is ValidationError {
    return error instanceof ValidationError;
  }

  /**
   * エラーがDatabaseErrorかどうかをチェック
   */
  static isDatabaseError(error: unknown): error is DatabaseError {
    return error instanceof DatabaseError;
  }
}

/**
 * エラー型の定義
 */
export type ErrorType = 
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * エラー詳細の型定義
 */
export interface ErrorDetails {
  field?: string;
  value?: unknown;
  expected?: unknown;
  received?: unknown;
  stack?: string;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * エラーレポートの型定義
 */
export interface ErrorReport {
  type: ErrorType;
  message: string;
  code: string;
  statusCode?: number;
  details?: ErrorDetails;
  context?: string;
  timestamp: string;
} 