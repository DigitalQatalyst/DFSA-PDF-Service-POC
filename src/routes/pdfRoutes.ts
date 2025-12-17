/**
 * PDF Generation Routes
 * Endpoints for PDF generation and template validation
 */

import { Router } from 'express';
import { generatePdfDocument, validateTemplateEndpoint } from '../controllers/pdfController';

const router = Router();

/**
 * POST /api/pdf/generate
 * Generate PDF document from Dataverse data
 *
 * Request Body:
 * {
 *   "applicationId": "guid",
 *   "documentType": "AuthorisedIndividual" (optional, default),
 *   "templateVersion": "1.0" (optional, default),
 *   "returnBuffer": false (optional, if true returns PDF file directly)
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "pdfUrl": "blob storage URL",
 *     "applicationId": "guid",
 *     "documentType": "AuthorisedIndividual",
 *     "templateVersion": "1.0",
 *     "generatedAt": "ISO timestamp",
 *     "conversionEngine": "graph|libreoffice",
 *     "duration": "1234ms"
 *   }
 * }
 */
router.post('/generate', generatePdfDocument);

/**
 * GET /api/pdf/validate-template/:documentType/:version
 * Validate if a DOCX template exists
 *
 * Example: GET /api/pdf/validate-template/AuthorisedIndividual/1.0
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "documentType": "AuthorisedIndividual",
 *     "version": "1.0",
 *     "exists": true,
 *     "templatePath": "templates/AuthorisedIndividual/AuthorisedIndividual_v1.0.docx"
 *   }
 * }
 */
router.get('/validate-template/:documentType/:version', validateTemplateEndpoint);

export default router;
