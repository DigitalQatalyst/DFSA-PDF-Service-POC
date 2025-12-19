/**
 * PDF Generation Controller
 * Handles PDF generation requests
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import { generatePdf } from '../services/pdf/pdfService';
import { validateTemplate } from '../services/templating/docxService';

/**
 * POST /api/pdf/generate
 * Generate PDF for an Authorised Individual application
 * Supports both Dataverse format (applicationId) and Power Pages format (user_info, form_data, metadata)
 */
export async function generatePdfDocument(req: Request, res: Response): Promise<void> {
  // Check if this is a Power Pages request format
  if (req.body.user_info && req.body.form_data && req.body.metadata) {
    // Forward to sync PDF controller
    const { generateSyncPdf } = await import('./syncPdfController');
    return generateSyncPdf(req, res);
  }

  const { applicationId, documentType = 'AuthorisedIndividual', templateVersion = '1.0', returnBuffer = false } = req.body;

  // Validate required fields for Dataverse format
  if (!applicationId) {
    res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'applicationId is required for Dataverse format, or provide user_info, form_data, and metadata for Power Pages format'
    });
    return;
  }

  logger.info('[PDF Controller] PDF generation requested', {
    applicationId,
    documentType,
    templateVersion
  });

  try {
    // Validate template exists
    const templateExists = await validateTemplate(documentType, templateVersion);
    if (!templateExists) {
      res.status(404).json({
        success: false,
        error: 'Template Not Found',
        message: `Template ${documentType}_v${templateVersion}.docx not found. Please ensure template file exists in templates/${documentType}/ directory.`
      });
      return;
    }

    // Generate PDF
    const result = await generatePdf({
      applicationId,
      documentType,
      templateVersion
    }, returnBuffer);

    // Return result
    if (returnBuffer && result.pdfBuffer) {
      // Return PDF as download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${documentType}_${applicationId}.pdf"`);
      res.send(result.pdfBuffer);
    } else {
      // Return metadata
      res.json({
        success: true,
        data: {
          pdfUrl: result.pdfUrl,
          applicationId: result.applicationId,
          documentType,
          templateVersion: result.templateVersion,
          generatedAt: result.generatedAt,
          conversionEngine: result.conversionEngine,
          duration: `${result.duration}ms`
        },
        message: 'PDF generated successfully'
      });
    }
  } catch (error) {
    logger.error('[PDF Controller] PDF generation failed', {
      applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Determine error type
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }

      if (error.message.includes('Template syntax error')) {
        res.status(400).json({
          success: false,
          error: 'Template Error',
          message: error.message
        });
        return;
      }

      if (error.message.includes('not configured')) {
        res.status(500).json({
          success: false,
          error: 'Configuration Error',
          message: error.message
        });
        return;
      }
    }

    // Generic error
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to generate PDF. Please check logs for details.'
    });
  }
}

/**
 * GET /api/pdf/validate-template/:documentType/:version
 * Validate if a template exists
 */
export async function validateTemplateEndpoint(req: Request, res: Response): Promise<void> {
  const { documentType, version } = req.params;

  try {
    const exists = await validateTemplate(documentType, version);

    res.json({
      success: true,
      data: {
        documentType,
        version,
        exists,
        templatePath: exists ? `templates/${documentType}/${documentType}_v${version}.docx` : null
      }
    });
  } catch (error) {
    logger.error('[PDF Controller] Template validation failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to validate template'
    });
  }
}
