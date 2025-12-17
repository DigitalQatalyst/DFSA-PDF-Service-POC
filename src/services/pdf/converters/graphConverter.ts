/**
 * Microsoft Graph PDF Converter
 * Uses Microsoft Graph API to convert DOCX to PDF
 * Requires: DOCX uploaded to OneDrive/SharePoint, then download as PDF
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import logger from '../../../utils/logger';
import { PdfConversionOptions } from '../pdfConverter';

/**
 * Convert DOCX to PDF using Microsoft Graph API
 */
export async function convertViaGraph(
  docxBuffer: Buffer,
  options: PdfConversionOptions
): Promise<Buffer> {
  const tenantId = process.env.GRAPH_TENANT_ID || process.env.AZURE_TENANT_ID;
  const clientId = process.env.GRAPH_CLIENT_ID || process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.GRAPH_CLIENT_SECRET || process.env.AZURE_CLIENT_SECRET;
  const siteId = process.env.GRAPH_SITE_ID;
  const driveId = process.env.GRAPH_DRIVE_ID;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Microsoft Graph credentials not configured');
  }

  // Authenticate
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  const tokenResponse = await credential.getToken(['https://graph.microsoft.com/.default']);

  // Create Graph client
  const client = Client.init({
    authProvider: (done) => {
      done(null, tokenResponse.token);
    }
  });

  // Upload DOCX to temporary location
  const tempFileName = `temp_${Date.now()}_${options.documentType}.docx`;
  logger.debug('Uploading DOCX to Graph', { tempFileName });

  // Upload to OneDrive/SharePoint
  const uploadPath = siteId && driveId
    ? `/sites/${siteId}/drives/${driveId}/root:/${tempFileName}:/content`
    : `/me/drive/root:/${tempFileName}:/content`;

  await client.api(uploadPath).put(docxBuffer);

  // Convert to PDF
  logger.debug('Converting to PDF via Graph API');
  const pdfPath = siteId && driveId
    ? `/sites/${siteId}/drives/${driveId}/root:/${tempFileName}:/content?format=pdf`
    : `/me/drive/root:/${tempFileName}:/content?format=pdf`;

  const pdfResponse = await client.api(pdfPath).get();

  // Download PDF buffer
  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

  logger.info('PDF converted successfully via Graph', {
    documentType: options.documentType,
    size: `${pdfBuffer.length} bytes`
  });

  // Clean up temporary file
  try {
    const deletePath = siteId && driveId
      ? `/sites/${siteId}/drives/${driveId}/root:/${tempFileName}`
      : `/me/drive/root:/${tempFileName}`;
    await client.api(deletePath).delete();
  } catch (cleanupError) {
    logger.warn('Failed to cleanup temporary file', { error: cleanupError });
  }

  return pdfBuffer;
}
