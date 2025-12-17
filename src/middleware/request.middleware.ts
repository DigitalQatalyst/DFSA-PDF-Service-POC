/**
 * Request Middleware
 * Adapted from KF implementation
 * - Request ID generation for correlation
 * - Request logging
 * - Security headers
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

/**
 * Generate unique request ID for correlation
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string || uuidv4();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
}

/**
 * Log incoming requests
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.id || '[no-id]';

  logger.info(`${requestId} ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${requestId} ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}

/**
 * Additional security headers
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

export default {
  requestId,
  requestLogger,
  securityHeaders
};
