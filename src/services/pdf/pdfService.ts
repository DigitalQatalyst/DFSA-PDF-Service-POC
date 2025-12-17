/**
 * PDF Generation Service
 * Orchestrates the full PDF generation pipeline:
 * 1. Fetch data from Dataverse
 * 2. Map to JSON DTO
 * 3. Generate DOCX from template
 * 4. Convert DOCX to PDF
 * 5. Store PDF and update Dataverse
 */

import dataverseClient from '../dataverse/dataverseClient';
import { mapToDTO } from '../../mappers/authorisedIndividualMapper';
import { generateDocx } from '../templating/docxService';
import { convertToPdf } from './pdfConverter';
import { storePdf } from '../storage/storageService';
import logger from '../../utils/logger';

export interface PdfGenerationRequest {
  applicationId: string;
  documentType: string;
  templateVersion: string;
}

export interface PdfGenerationResult {
  pdfUrl: string;
  pdfBuffer?: Buffer;  // Optional: return buffer for direct download
  templateVersion: string;
  generatedAt: string;
  applicationId: string;
  conversionEngine: string;
  duration: number;
}

export async function generatePdf(request: PdfGenerationRequest, returnBuffer = false): Promise<PdfGenerationResult> {
  const startTime = Date.now();
  logger.info('Starting PDF generation', { request });

  try {
    // Step 1: Fetch data from Dataverse
    logger.debug('Fetching application data from Dataverse');
    const dataverseData = await dataverseClient.getAuthorisedIndividual(request.applicationId);

    // Step 2: Map to JSON DTO
    logger.debug('Mapping Dataverse data to DTO');
    const dto = mapToDTO(dataverseData);

    // Step 3: Generate DOCX from template
    logger.debug('Generating DOCX from template');
    const docxBuffer = await generateDocx({
      documentType: request.documentType,
      templateVersion: request.templateVersion,
      data: dto as unknown as Record<string, unknown>
    });

    // Step 4: Convert DOCX to PDF
    logger.debug('Converting DOCX to PDF');
    const pdfBuffer = await convertToPdf(docxBuffer, {
      documentType: request.documentType,
      templateVersion: request.templateVersion
    });

    // Step 5: Store PDF
    logger.debug('Storing PDF');
    const pdfUrl = await storePdf({
      applicationId: request.applicationId,
      documentType: request.documentType,
      templateVersion: request.templateVersion,
      pdfBuffer
    });

    const duration = Date.now() - startTime;
    logger.info('PDF generation completed', {
      applicationId: request.applicationId,
      pdfUrl,
      duration: `${duration}ms`
    });

    const result: PdfGenerationResult = {
      pdfUrl,
      templateVersion: request.templateVersion,
      generatedAt: new Date().toISOString(),
      applicationId: request.applicationId,
      conversionEngine: process.env.PDF_CONVERSION_ENGINE || 'graph',
      duration
    };

    if (returnBuffer) {
      result.pdfBuffer = pdfBuffer;
    }

    return result;
  } catch (error) {
    logger.error('PDF generation failed', {
      applicationId: request.applicationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}
