/**
 * Error Handling Middleware
 * Adapted from KF implementation
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.id || '[no-id]';

  logger.warn(`${requestId} 404 Not Found`, {
    method: req.method,
    path: req.path
  });

  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path
  });
}

/**
 * Global error handler
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.id || '[no-id]';

  logger.error(`${requestId} Error handler caught`, {
    error: error.message || error,
    stack: error.stack,
    status: error.status || error.statusCode,
    path: req.path
  });

  const statusCode = error.status || error.statusCode || 500;

  const response: any = {
    success: false,
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message: error.message || 'An unexpected error occurred'
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.details = error;
  }

  res.status(statusCode).json(response);
}

export default {
  notFoundHandler,
  errorHandler
};
