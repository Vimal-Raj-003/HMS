import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    status,
    message: err.message,
    code: err.code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    status: 'error',
    message: `Not Found - ${req.method} ${req.originalUrl}`,
  });
};

export class ApiError extends Error {
  statusCode: number;
  status: string;
  code?: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = 'error';
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code?: string) {
    return new ApiError(400, message, code);
  }

  static unauthorized(message: string = 'Unauthorized', code?: string) {
    return new ApiError(401, message, code);
  }

  static forbidden(message: string = 'Forbidden', code?: string) {
    return new ApiError(403, message, code);
  }

  static notFound(message: string = 'Resource not found', code?: string) {
    return new ApiError(404, message, code);
  }

  static conflict(message: string, code?: string) {
    return new ApiError(409, message, code);
  }

  static tooManyRequests(message: string, code?: string) {
    return new ApiError(429, message, code);
  }

  static internal(message: string = 'Internal Server Error', code?: string) {
    return new ApiError(500, message, code);
  }
}
