import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to authenticate API requests using API key
 * Expects API key in Authorization header: "Bearer <API_KEY>"
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
  }

  // Extract API key from "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid Authorization header format. Expected: Bearer <API_KEY>'
    });
  }

  const apiKey = parts[1];
  const expectedApiKey = process.env.API_KEY;

  // Validate API key exists in environment
  if (!expectedApiKey) {
    console.error('[Auth] API_KEY not configured in environment variables');
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'API authentication not configured'
    });
  }

  // Compare API keys
  if (apiKey !== expectedApiKey) {
    console.warn('[Auth] Invalid API key attempt');
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid API key'
    });
  }

  // API key is valid, proceed to next middleware/handler
  next();
}
