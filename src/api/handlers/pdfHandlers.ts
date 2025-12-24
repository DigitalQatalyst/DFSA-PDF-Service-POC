import { Request, Response } from 'express';
import { generatePdf } from '../../services/pdf/pdfService';
import { generateDocx } from '../../services/templating/docxService';
import { convertViaLibreOffice } from '../../services/pdf/converters/libreOfficeConverter';
import dataverseClient from '../../services/dataverse/dataverseClient';
import { mapToDTO } from '../../mappers/authorisedIndividualMapper';
import { storePdf } from '../../services/storage/storageService';
import { PDFServicePlanA } from '../../services/pdf/pdfServicePlanA';
import { EmailService } from '../../services/email/EmailService';

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

/**
 * Handler for POST /api/pdf/generate-and-email
 * PLAN A INTEGRATION: Generate PDF with beautiful styling and email to applicant
 *
 * Flow:
 * 1. Fetch data from Dataverse
 * 2. Map to DTO (Plan C pipeline)
 * 3. Generate PDF with Plan A styling (Puppeteer + Handlebars)
 * 4. Email PDF to applicant (dfsa_ai_emailaddress)
 * 5. Upload to Azure Blob in background
 * 6. Return success response
 */
export async function generateAndEmailPdfHandler(req: Request, res: Response) {
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

    console.log(`[Plan A Email] Starting PDF generation and email for recordId: ${recordId}`);

    // Step 1: Fetch data from Dataverse (Plan C pipeline)
    const rawData = await dataverseClient.getAuthorisedIndividual(recordId);

    // Step 2: Map to DTO (Plan C pipeline)
    const dto = mapToDTO(rawData);

    // Step 3: Generate PDF with Plan A styling (Puppeteer + Handlebars)
    console.log('[Plan A Email] Generating PDF with Plan A styling...');
    const pdfBuffer = await PDFServicePlanA.generatePDF(dto);
    console.log(`[Plan A Email] PDF generated: ${pdfBuffer.length} bytes`);

    // Step 4: Get applicant email from DTO
    let applicantEmail = dto.Application.Requestor.Email;
    const applicantName = dto.Application.AuthorisedIndividualName;
    const requestorEmail = dto.Application.Requestor.Email || 'noreply@dfsa.ae';

    // DEMO MODE: Override recipient email if DEMO_EMAIL_OVERRIDE is set
    if (process.env.DEMO_EMAIL_OVERRIDE) {
      console.log(`[DEMO MODE] Overriding recipient email from ${applicantEmail} to ${process.env.DEMO_EMAIL_OVERRIDE}`);
      applicantEmail = process.env.DEMO_EMAIL_OVERRIDE;
    }

    if (!applicantEmail) {
      return res.status(400).json({
        success: false,
        error: 'Applicant email (dfsa_ai_emailaddress) not found in record',
        recordId: recordId
      });
    }

    // Step 5: Send email with PDF attachment
    console.log(`[Plan A Email] Sending email to: ${applicantEmail}`);
    const emailService = new EmailService();

    await emailService.sendApplicationPDF({
      recipientEmail: applicantEmail,
      applicantName: applicantName,
      applicationId: dto.Application.Id || recordId,
      requestorEmail: requestorEmail,
      pdfBuffer: pdfBuffer
    });

    console.log('[Plan A Email] Email sent successfully');

    // Step 6: Upload to blob storage in background (non-blocking)
    setImmediate(async () => {
      try {
        console.log(`[Plan A Email] Starting background blob upload for recordId: ${recordId}`);

        const blobUrl = await storePdf({
          applicationId: recordId,
          documentType: 'AuthorisedIndividual',
          templateVersion: '1.0-PlanA',
          pdfBuffer
        });

        console.log(`[Plan A Email] Uploaded to blob storage: ${blobUrl}`);

        // TODO: Update Dataverse record with PDF URL and generated date
        // await dataverseClient.updateAuthorisedIndividual(recordId, {
        //   dfsa_pdf_url: blobUrl,
        //   dfsa_pdf_generated_date: new Date().toISOString()
        // });

      } catch (uploadError: any) {
        console.error(`[Plan A Email] Background upload failed for recordId: ${recordId}`, uploadError);
        // Don't throw - email already sent successfully
      }
    });

    // Step 7: Return success response
    return res.status(200).json({
      success: true,
      message: 'PDF generated and emailed successfully',
      recipientEmail: applicantEmail,
      applicantName: applicantName,
      recordId: recordId,
      generatedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Plan A Email] Error:', error);

    // Check for specific error types
    if (error.message?.includes('Record not found')) {
      return res.status(404).json({
        success: false,
        error: 'Record not found in Dataverse',
        recordId: req.body.recordId
      });
    }

    if (error.message?.includes('Email delivery failed')) {
      return res.status(500).json({
        success: false,
        error: 'Email delivery failed',
        details: error.message
      });
    }

    if (error.message?.includes('PDF generation failed')) {
      return res.status(500).json({
        success: false,
        error: 'PDF generation failed',
        details: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error during PDF generation and email',
      message: error.message
    });
  }
}

/**
 * Handler for POST /api/pdf/test-email
 * TEST ENDPOINT: Send test email to any address to verify Resend configuration
 */
export async function testEmailHandler(req: Request, res: Response) {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: testEmail'
      });
    }

    console.log(`[Test Email] Sending test email to: ${testEmail}`);

    const emailService = new EmailService();

    // Generate a small test PDF
    const testPdfContent = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 24 Tf 100 700 Td (Test PDF) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000317 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n404\n%%EOF');

    await emailService.sendApplicationPDF({
      recipientEmail: testEmail,
      applicantName: 'Test User',
      applicationId: 'TEST-001',
      requestorEmail: 'test@example.com',
      pdfBuffer: testPdfContent
    });

    console.log('[Test Email] Test email sent successfully');

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      recipientEmail: testEmail,
      note: 'Check your inbox (and spam folder) for the test email with PDF attachment'
    });

  } catch (error: any) {
    console.error('[Test Email] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: error.message
    });
  }
}
