/**
 * DFSA PDF Service POC - Main Entry Point
 *
 * POC Goals:
 * 1. Demonstrate Dataverse integration
 * 2. Show canonical structure mapping
 * 3. Prove conditional logic works correctly
 *
 * Based on KF Express implementation with DFSA-specific entities
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import logger from './utils/logger';
import env from './config/env';
import {
  requestId,
  requestLogger,
  securityHeaders
} from './middleware/request.middleware';
import {
  errorHandler,
  notFoundHandler
} from './middleware/error.middleware';
import authorisedIndividualRoutes from './routes/authorisedIndividualRoutes';
import pdfRoutes from './routes/pdfRoutes';

// Initialize Express app
const app: Application = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// --- CORS CONFIGURATION (HARDENED vs KF) ---
const allowedOrigins = env.ALLOWED_ORIGINS;

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('[CORS] Blocked request from unauthorized origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400, // 24 hours
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
};

// --- SECURITY MIDDLEWARE ---
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(securityHeaders);
app.use(cors(corsOptions));

// --- GENERAL MIDDLEWARE ---
app.use(requestId);
app.use(requestLogger);
app.use(compression());
app.use(express.json({ limit: '1mb' })); // Reduced from KF's 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- HEALTH CHECK ROUTES ---
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DFSA PDF Service POC',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      list: '/api/v1/authorised-individual/list',
      get: '/api/v1/authorised-individual/:id',
      conditionalDemo: '/api/v1/authorised-individual/:id/conditional-demo',
      pdfGenerate: '/api/pdf/generate',
      validateTemplate: '/api/pdf/validate-template/:documentType/:version'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: env.NODE_ENV,
    dataverseUrl: env.DATAVERSE_URL
  });
});

// --- API ROUTES ---
app.use('/api/v1/authorised-individual', authorisedIndividualRoutes);
app.use('/api/pdf', pdfRoutes);

// --- ERROR HANDLING ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- START SERVER ---
const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info('='.repeat(60));
  logger.info('DFSA PDF Service POC Started');
  logger.info('='.repeat(60));
  logger.info(`Environment: ${env.NODE_ENV}`);
  logger.info(`Port: ${PORT}`);
  logger.info(`Dataverse URL: ${env.DATAVERSE_URL}`);
  logger.info(`Allowed Origins: ${env.ALLOWED_ORIGINS.join(', ')}`);
  logger.info('='.repeat(60));
  logger.info('API Endpoints:');
  logger.info('  [POC - Demonstration]');
  logger.info(`    GET  http://localhost:${PORT}/health`);
  logger.info(`    GET  http://localhost:${PORT}/api/v1/authorised-individual/list`);
  logger.info(`    GET  http://localhost:${PORT}/api/v1/authorised-individual/:id`);
  logger.info(`    GET  http://localhost:${PORT}/api/v1/authorised-individual/:id/conditional-demo`);
  logger.info('  [PDF Generation]');
  logger.info(`    POST http://localhost:${PORT}/api/pdf/generate`);
  logger.info(`    GET  http://localhost:${PORT}/api/pdf/validate-template/:documentType/:version`);
  logger.info('='.repeat(60));
});

export default app;
