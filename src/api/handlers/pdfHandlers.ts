import { Request, Response } from 'express';
import { generatePdf } from '../../services/pdf/pdfService';
import { generateDocx } from '../../services/templating/docxService';
import dataverseClient from '../../services/dataverse/dataverseClient';
import { mapToDTO } from '../../mappers/authorisedIndividualMapper';

/**
 * Handler for POST /api/pdf/generate
 * Generates a PDF for an Authorised Individual application
 */
export async function generatePdfHandler(req: Request, res: Response) {
  try {
    const { recordId } = req.body;

    // Validate request
    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: recordId'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recordId format. Expected UUID format.'
      });
    }

    console.log(`[PDF Generation] Starting for recordId: ${recordId}`);

    // Call existing PDF generation service
    const result = await generatePdf({
      applicationId: recordId,
      documentType: 'AuthorisedIndividual',
      templateVersion: '1.0'
    });

    console.log(`[PDF Generation] Completed for recordId: ${recordId}`);
    console.log(`[PDF Generation] PDF URL: ${result.pdfUrl}`);

    // Return success response
    return res.status(200).json({
      success: true,
      pdfUrl: result.pdfUrl,
      recordId: recordId,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[PDF Generation] Error:', error);

    // Check for specific error types
    if (error.message?.includes('Record not found')) {
      return res.status(404).json({
        success: false,
        error: 'Record not found in Dataverse',
        recordId: req.body.recordId
      });
    }

    if (error.message?.includes('Template not found')) {
      return res.status(500).json({
        success: false,
        error: 'PDF template not found',
        details: error.message
      });
    }

    if (error.message?.includes('PDF conversion failed')) {
      return res.status(500).json({
        success: false,
        error: 'PDF conversion failed',
        details: error.message
      });
    }

    if (error.message?.includes('Blob upload failed')) {
      return res.status(500).json({
        success: false,
        error: 'Failed to upload PDF to storage',
        details: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF generation',
      message: error.message
    });
  }
}

/**
 * Handler for POST /api/docx/generate
 * Generates a DOCX file for an Authorised Individual application
 * Returns the DOCX as a downloadable file
 */
export async function generateDocxHandler(req: Request, res: Response) {
  try {
    const { recordId } = req.body;

    // Validate request
    if (!recordId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: recordId'
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recordId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recordId format. Expected UUID format.'
      });
    }

    console.log(`[DOCX Generation] Starting for recordId: ${recordId}`);

    // Fetch data from Dataverse
    const rawData = await dataverseClient.getAuthorisedIndividual(recordId);

    // Map to DTO
    const dto = mapToDTO(rawData);

    // Generate DOCX
    const docxBuffer = await generateDocx({
      data: dto,
      documentType: 'AuthorisedIndividual',
      templateVersion: '1.0'
    });

    console.log(`[DOCX Generation] Completed for recordId: ${recordId}`);
    console.log(`[DOCX Generation] Size: ${docxBuffer.length} bytes`);

    // Set headers for file download
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `AuthorisedIndividual_${recordId}_${timestamp}.docx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', docxBuffer.length);

    // Send DOCX file
    return res.send(docxBuffer);

  } catch (error: any) {
    console.error('[DOCX Generation] Error:', error);

    // Check for specific error types
    if (error.message?.includes('Record not found')) {
      return res.status(404).json({
        success: false,
        error: 'Record not found in Dataverse',
        recordId: req.body.recordId
      });
    }

    if (error.message?.includes('Template not found')) {
      return res.status(500).json({
        success: false,
        error: 'DOCX template not found',
        details: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error during DOCX generation',
      message: error.message
    });
  }
}

/**
 * Handler for GET /api/pdf/status/:jobId
 * Checks the status of an async PDF generation job
 * (Placeholder for future async implementation)
 */
export async function getPdfStatusHandler(req: Request, res: Response) {
  try {
    const { jobId } = req.params;

    // TODO: Implement job status tracking with Redis or database
    // For now, return not implemented
    return res.status(501).json({
      success: false,
      error: 'Async job status tracking not yet implemented',
      message: 'PDF generation is currently synchronous. Use POST /api/pdf/generate instead.'
    });

  } catch (error: any) {
    console.error('[PDF Status] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
