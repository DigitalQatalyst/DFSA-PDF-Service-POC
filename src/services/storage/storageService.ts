/**
 * Storage Service
 * Handles PDF storage in Azure Blob Storage or SharePoint
 */

import { BlobServiceClient } from '@azure/storage-blob';
import logger from '../../utils/logger';

export interface StorePdfRequest {
  applicationId: string;
  documentType: string;
  templateVersion: string;
  pdfBuffer: Buffer;
}

/**
 * Store PDF and return URL
 */
export async function storePdf(request: StorePdfRequest): Promise<string> {
  const storageType = process.env.STORAGE_TYPE || 'blob';

  if (storageType === 'blob') {
    return storeInBlobStorage(request);
  } else {
    throw new Error(`Storage type not implemented: ${storageType}`);
  }
}

/**
 * Store PDF in Azure Blob Storage
 */
async function storeInBlobStorage(request: StorePdfRequest): Promise<string> {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'pdf-documents';

  if (!connectionString) {
    logger.warn('Azure Storage not configured - skipping PDF storage');
    return 'storage://not-configured';
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Ensure container exists
    await containerClient.createIfNotExists();

    // Generate blob name: applications/{applicationId}/{documentType}/{timestamp}-v{version}.pdf
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const blobName = `applications/${request.applicationId}/${request.documentType}/${timestamp}-v${request.templateVersion}.pdf`;

    // Upload PDF
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(request.pdfBuffer, request.pdfBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/pdf'
      },
      metadata: {
        applicationId: request.applicationId,
        documentType: request.documentType,
        templateVersion: request.templateVersion,
        generatedAt: new Date().toISOString()
      }
    });

    const blobUrl = blockBlobClient.url;
    logger.info('PDF stored in Blob Storage', {
      blobName,
      blobUrl,
      size: `${request.pdfBuffer.length} bytes`
    });

    return blobUrl;
  } catch (error) {
    logger.error('Failed to store PDF in Blob Storage', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Don't fail entire PDF generation if storage fails
    logger.warn('Continuing without storage');
    return 'storage://failed';
  }
}
