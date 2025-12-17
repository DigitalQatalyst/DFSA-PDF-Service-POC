/**
 * DOCX Template Service
 * Uses docxtemplater to merge JSON data into DOCX templates
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs/promises';
import path from 'path';
import logger from '../../utils/logger';

export interface DocxGenerationRequest {
  documentType: string;
  templateVersion: string;
  data: Record<string, unknown>;
}

/**
 * Generate DOCX document from template and data
 */
export async function generateDocx(request: DocxGenerationRequest): Promise<Buffer> {
  try {
    // Load template file
    const templatePath = getTemplatePath(request.documentType, request.templateVersion);
    logger.debug('Loading template', { templatePath });

    const templateBuffer = await fs.readFile(templatePath);

    // Load template into PizZip
    const zip = new PizZip(templateBuffer);

    // Create docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    // Render document with data
    logger.debug('Rendering template with data', {
      documentType: request.documentType,
      dataKeys: Object.keys(request.data)
    });

    doc.render(request.data);

    // Generate output buffer
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    logger.info('DOCX generated successfully', {
      documentType: request.documentType,
      templateVersion: request.templateVersion,
      size: `${buf.length} bytes`
    });

    return Buffer.from(buf);
  } catch (error) {
    logger.error('DOCX generation failed', {
      documentType: request.documentType,
      templateVersion: request.templateVersion,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Provide helpful error messages for common docxtemplater errors
    if (error instanceof Error) {
      if (error.message.includes('Unclosed tag')) {
        throw new Error(`Template syntax error: Unclosed tag in template. ${error.message}`);
      }
      if (error.message.includes('Unopened tag')) {
        throw new Error(`Template syntax error: Unopened tag in template. ${error.message}`);
      }
    }

    throw error;
  }
}

/**
 * Get the file path for a template
 */
function getTemplatePath(documentType: string, version: string): string {
  const templatesPath = process.env.TEMPLATES_PATH || path.join(process.cwd(), 'src', 'templates');
  const filename = `${documentType}_v${version}.docx`;
  return path.join(templatesPath, documentType, filename);
}

/**
 * Validate template exists
 */
export async function validateTemplate(documentType: string, version: string): Promise<boolean> {
  try {
    const templatePath = getTemplatePath(documentType, version);
    await fs.access(templatePath);
    return true;
  } catch {
    return false;
  }
}
