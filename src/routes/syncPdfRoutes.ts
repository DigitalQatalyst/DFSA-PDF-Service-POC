/**
 * Synchronous PDF Routes
 * Fast PDF generation endpoints for Power Pages integration
 */

import { Router } from 'express';
import { generateSyncPdf, healthCheck } from '../controllers/syncPdfController';

const router = Router();

/**
 * POST /api/pdf/generate-docx
 * Generate PDF synchronously from Power Pages form data
 *
 * Request Body:
 * {
 *   "user_info": {
 *     "full_name": "John Doe",
 *     "email": "john.doe@example.com"
 *   },
 *   "form_data": {
 *     "submission_id": "123e4567-e89b-12d3-a456-426614174000",
 *     "fields": {
 *       "firstName": "John",
 *       "lastName": "Doe",
 *       "email": "john.doe@example.com",
 *       // ... other form fields
 *     }
 *   },
 *   "metadata": {
 *     "template_id": "authorised-individual",
 *     "download_name": "DFSA_AuthorisedIndividual_Application"
 *   }
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "pdf_base64": "base64-encoded-pdf-content",
 *     "filename": "DFSA_AuthorisedIndividual_Application_2024-01-15T10-30-00.pdf",
 *     "size_bytes": 123456,
 *     "template_id": "authorised-individual",
 *     "submission_id": "123e4567-e89b-12d3-a456-426614174000",
 *     "generated_at": "2024-01-15T10:30:00.000Z",
 *     "execution_time_ms": 1234
 *   }
 * }
 */
router.post('/generate-docx', generateSyncPdf);

/**
 * GET /api/pdf/health
 * Health check for sync PDF service
 */
router.get('/health', healthCheck);

export default router;