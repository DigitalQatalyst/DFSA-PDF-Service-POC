/**
 * PDF Conversion Service
 * Converts DOCX to PDF using configured engine (Graph API, LibreOffice, etc.)
 */

import logger from '../../utils/logger';
import { convertViaGraph } from './converters/graphConverter';
import { convertViaLibreOffice } from './converters/libreOfficeConverter';

export interface PdfConversionOptions {
  documentType: string;
  templateVersion: string;
}

/**
 * Convert DOCX buffer to PDF buffer
 */
export async function convertToPdf(
  docxBuffer: Buffer,
  options: PdfConversionOptions
): Promise<Buffer> {
  const engine = process.env.PDF_CONVERSION_ENGINE || 'graph';

  logger.debug('Converting DOCX to PDF', {
    engine,
    documentType: options.documentType,
    docxSize: `${docxBuffer.length} bytes`
  });

  try {
    let pdfBuffer: Buffer;

    switch (engine.toLowerCase()) {
      case 'graph':
        pdfBuffer = await convertViaGraph(docxBuffer, options);
        break;
      case 'libreoffice':
        pdfBuffer = await convertViaLibreOffice(docxBuffer, options);
        break;
      default:
        throw new Error(`Unsupported PDF conversion engine: ${engine}`);
    }

    logger.info('PDF conversion completed', {
      engine,
      pdfSize: `${pdfBuffer.length} bytes`
    });

    return pdfBuffer;
  } catch (error) {
    logger.error('PDF conversion failed', {
      engine,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
