/**
 * Environment Configuration
 * Validates and exports environment variables
 */

import dotenv from 'dotenv';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Validate required environment variables
 */
function validateEnv(): void {
  const required = [
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'DATAVERSE_URL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  logger.info('Environment variables validated successfully');
}

// Validate on load
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}

/**
 * Typed environment configuration
 */
export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),

  // Azure AD
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID!,
  AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID!,
  AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET!,

  // Dataverse
  DATAVERSE_URL: process.env.DATAVERSE_URL!,
  DATAVERSE_API_VERSION: process.env.DATAVERSE_API_VERSION || 'v9.2',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  POWER_PAGES_URL: process.env.POWER_PAGES_URL,

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10)
};

export default env;
