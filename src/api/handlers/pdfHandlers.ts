import { Request, Response } from 'express';
import { generatePdf } from '../../services/pdf/pdfService';
import { generateDocx } from '../../services/templating/docxService';
import { convertViaLibreOffice } from '../../services/pdf/converters/libreOfficeConverter';
import dataverseClient from '../../services/dataverse/dataverseClient';
import { mapToDTO } from '../../mappers/authorisedIndividualMapper';
import { storePdf } from '../../services/storage/storageService';

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
      data: dto as unknown as Record<string, unknown>,
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
 * Handler for POST /api/pdf/download
 * IMPROVED FLOW: Generate PDF and download immediately, upload to blob in background
 *
 * Flow:
 * 1. Fetch data from Dataverse (~1s)
 * 2. Generate DOCX (~1s)
 * 3. Convert to PDF (~18s)
 * 4. Send PDF to user immediately for download
 * 5. Upload to Azure Blob Storage in background (non-blocking)
 * 6. Update Dataverse record asynchronously
 */
export async function downloadPdfHandler(req: Request, res: Response) {
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

    console.log(`[PDF Download] Starting for recordId: ${recordId}`);

    // Step 1: Fetch data from Dataverse
    const rawData = await dataverseClient.getAuthorisedIndividual(recordId);

    // Step 2: Map to DTO
    const dto = mapToDTO(rawData);

    // Step 3: Generate DOCX
    const docxBuffer = await generateDocx({
      data: dto as unknown as Record<string, unknown>,
      documentType: 'AuthorisedIndividual',
      templateVersion: '1.0'
    });

    console.log(`[PDF Download] DOCX generated: ${docxBuffer.length} bytes`);

    // Step 4: Convert to PDF (this takes ~18 seconds)
    const pdfBuffer = await convertViaLibreOffice(docxBuffer, {
      documentType: 'AuthorisedIndividual',
      templateVersion: '1.0'
    });

    console.log(`[PDF Download] PDF converted: ${pdfBuffer.length} bytes`);

    // Step 5: Send PDF to user IMMEDIATELY (don't wait for blob upload)
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `AuthorisedIndividual_${recordId}_${timestamp}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF file to user
    res.send(pdfBuffer);

    console.log(`[PDF Download] PDF sent to user (${pdfBuffer.length} bytes)`);

    // Step 6: Upload to blob storage in background (non-blocking)
    // This runs AFTER the response is sent, so user doesn't wait
    setImmediate(async () => {
      try {
        console.log(`[PDF Upload] Starting background upload for recordId: ${recordId}`);

        const blobUrl = await storePdf({
          applicationId: recordId,
          documentType: 'AuthorisedIndividual',
          templateVersion: '1.0',
          pdfBuffer
        });

        console.log(`[PDF Upload] Uploaded to blob storage: ${blobUrl}`);

        // TODO: Update Dataverse record with PDF URL
        // This would require adding a new field to store the blob URL
        // await dataverseClient.updateAuthorisedIndividual(recordId, {
        //   dfsa_pdf_url: blobUrl,
        //   dfsa_pdf_generated_date: new Date().toISOString()
        // });

      } catch (uploadError: any) {
        console.error(`[PDF Upload] Background upload failed for recordId: ${recordId}`, uploadError);
        // Don't throw - user already has their PDF
        // Could log to monitoring system here
      }
    });

  } catch (error: any) {
    console.error('[PDF Download] Error:', error);

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

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF generation',
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
