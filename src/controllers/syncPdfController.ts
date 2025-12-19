/**
 * Synchronous PDF Controller
 * Fast PDF generation for Power Pages integration
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import { SyncPdfService } from '../services/pdf/syncPdfService';

// Initialize service
const syncPdfService = new SyncPdfService();

/**
 * Power Pages PDF Request Interface
 */
export interface PowerPagesPdfRequest {
  user_info: {
    full_name: string;
    email: string;
  };
  form_data: {
    submission_id: string;
    fields: Record<string, any>;
  };
  metadata: {
    template_id: string;
    download_name: string;
  };
}

/**
 * POST /api/pdf/generate-docx
 * Generate PDF synchronously from Power Pages form data
 */
export async function generateSyncPdf(req: Request, res: Response): Promise<void> {
  const requestId = req.id || '[no-id]';
  const startTime = Date.now();

  try {
    logger.info(`${requestId} Starting sync PDF generation`, {
      templateId: req.body.metadata?.template_id,
      submissionId: req.body.form_data?.submission_id
    });

    // Validate request body
    const request = req.body as PowerPagesPdfRequest;
    if (!request.user_info || !request.form_data || !request.metadata) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format. Required: user_info, form_data, metadata'
      });
      return;
    }

    // Generate PDF
    const result = await syncPdfService.generatePdf(request);

    const executionTime = Date.now() - startTime;
    logger.info(`${requestId} Sync PDF generated successfully`, {
      templateId: request.metadata.template_id,
      sizeBytes: result.size_bytes,
      executionTimeMs: executionTime
    });

    // Return PDF as base64
    res.json({
      success: true,
      data: {
        pdf_base64: result.pdf_base64,
        filename: result.filename,
        size_bytes: result.size_bytes,
        template_id: request.metadata.template_id,
        submission_id: request.form_data.submission_id,
        generated_at: new Date().toISOString(),
        execution_time_ms: executionTime
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(`${requestId} Sync PDF generation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: executionTime
    });

    res.status(500).json({
      success: false,
      error: 'PDF generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/pdf/health
 * Health check for sync PDF service
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  try {
    res.json({
      success: true,
      service: 'Sync PDF Service',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service unhealthy'
    });
  }
}

export default {
  generateSyncPdf,
  healthCheck
};