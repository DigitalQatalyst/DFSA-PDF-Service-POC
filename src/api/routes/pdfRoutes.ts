import { Router } from 'express';
import { generatePdfHandler, generateDocxHandler, downloadPdfHandler, getPdfStatusHandler, generateAndEmailPdfHandler, testEmailHandler } from '../handlers/pdfHandlers';
import { authenticateApiKey } from '../middleware/authMiddleware';

const router = Router();

// Most routes require API key authentication
// But /download is public (called from Power Pages frontend)
router.post('/download', downloadPdfHandler);

// All other routes require API key authentication
router.use(authenticateApiKey);

/**
 * POST /api/pdf/generate
 * OLD FLOW: Generate PDF and upload to blob storage, then return URL
 * User waits for: Dataverse + DOCX + PDF + Blob Upload (~21s)
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

// /download route is registered above (before auth middleware)

/**
 * POST /api/pdf/generate-docx
 * Generate DOCX file for an Authorised Individual application
 * Returns DOCX file directly for download
 *
 * Request body:
 * {
 *   "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8"
 * }
 *
 * Response: Binary DOCX file
 */
router.post('/generate-docx', generateDocxHandler);

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

/**
 * POST /api/pdf/generate-and-email
 * PLAN A INTEGRATION: Generate PDF with beautiful styling and email to applicant
 * Combines Plan C's real data pipeline with Plan A's Puppeteer styling and Resend email
 *
 * Request body:
 * {
 *   "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "PDF generated and emailed successfully",
 *   "recipientEmail": "applicant@example.com",
 *   "applicantName": "John Doe",
 *   "recordId": "18036be5-dadb-f011-8544-6045bd69d7d8",
 *   "generatedAt": "2025-12-22T10:30:00.000Z"
 * }
 */
router.post('/generate-and-email', generateAndEmailPdfHandler);

/**
 * POST /api/pdf/test-email
 * TEST ENDPOINT: Send test email to verify Resend configuration
 * Useful for debugging email delivery issues
 *
 * Request body:
 * {
 *   "testEmail": "test@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Test email sent successfully",
 *   "recipientEmail": "test@example.com",
 *   "note": "Check your inbox (and spam folder) for the test email with PDF attachment"
 * }
 */
router.post('/test-email', testEmailHandler);

export default router;
