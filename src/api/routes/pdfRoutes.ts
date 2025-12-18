import { Router } from 'express';
import { generatePdfHandler, getPdfStatusHandler } from '../handlers/pdfHandlers';
import { authenticateApiKey } from '../middleware/authMiddleware';

const router = Router();

// All routes require API key authentication
router.use(authenticateApiKey);

/**
 * POST /api/pdf/generate
 * Generate PDF for an Authorised Individual application
 *
 * Request body:
 * {
 *   "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "pdfUrl": "https://storage.blob.core.windows.net/pdfs/...",
 *   "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8",
 *   "generatedAt": "2025-12-18T10:30:00.000Z"
 * }
 */
router.post('/generate', generatePdfHandler);

/**
 * GET /api/pdf/status/:jobId
 * Check status of PDF generation job (for async processing)
 *
 * Response:
 * {
 *   "jobId": "job-123",
 *   "status": "completed" | "processing" | "failed",
 *   "pdfUrl": "https://...", // if completed
 *   "error": "..." // if failed
 * }
 */
router.get('/status/:jobId', getPdfStatusHandler);

export default router;
