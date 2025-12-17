/**
 * LibreOffice Headless PDF Converter
 * Uses LibreOffice in headless mode to convert DOCX to PDF
 * Requires: LibreOffice installed in container/environment
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import logger from '../../../utils/logger';
import { PdfConversionOptions } from '../pdfConverter';

const execAsync = promisify(exec);

/**
 * Convert DOCX to PDF using LibreOffice headless
 */
export async function convertViaLibreOffice(
  docxBuffer: Buffer,
  options: PdfConversionOptions
): Promise<Buffer> {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const inputPath = join(tempDir, `input_${timestamp}.docx`);
  const outputDir = join(tempDir, `output_${timestamp}`);
  const outputFilename = `input_${timestamp}.pdf`;
  const outputPath = join(outputDir, outputFilename);

  try {
    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Write DOCX to temp file
    await writeFile(inputPath, docxBuffer);

    // Run LibreOffice conversion
    logger.debug('Running LibreOffice conversion', { inputPath, outputDir });
    const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${inputPath}"`;

    await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    // Read PDF result
    const pdfBuffer = await readFile(outputPath);

    logger.info('PDF converted successfully via LibreOffice', {
      documentType: options.documentType,
      size: `${pdfBuffer.length} bytes`
    });

    // Cleanup
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    return pdfBuffer;
  } catch (error) {
    logger.error('LibreOffice conversion failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Cleanup on error
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    throw new Error(`LibreOffice conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
