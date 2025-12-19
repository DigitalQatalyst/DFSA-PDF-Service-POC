/**
 * Synchronous PDF Service
 * Fast PDF generation using pdf-lib (Vercel-compatible) for Power Pages integration
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import logger from '../../utils/logger';

export interface PowerPagesPdfRequest {
  user_info: {
    full_name: string;
    email: string;
  };
  form_data: {
    submission_id: string;
    fields: Record<string, any>;
  };
  metadata: {
    template_id: string;
    download_name: string;
  };
}

export interface PdfGenerationResult {
  pdf_base64: string;
  filename: string;
  size_bytes: number;
}

export class SyncPdfService {
  constructor() {
    logger.info('[SyncPdfService] Service initialized for Vercel deployment');
  }

  /**
   * Generate PDF from request data
   * Uses external PDF generation service compatible with Vercel
   */
  public async generatePdf(request: PowerPagesPdfRequest): Promise<PdfGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Generate HTML content from template
      const htmlContent = await this.generateHtmlContent(request);
      
      // Use external PDF generation service (e.g., PDFShift, HTML2PDF API, etc.)
      // For now, we'll return a placeholder that can be replaced with actual service
      const pdfBuffer = await this.convertHtmlToPdf(htmlContent);
      
      // Convert to base64
      const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${request.metadata.download_name}_${timestamp}.pdf`;

      const result: PdfGenerationResult = {
        pdf_base64: pdfBase64,
        filename: filename,
        size_bytes: pdfBuffer.length
      };

      const executionTime = Date.now() - startTime;
      logger.info('[SyncPdfService] PDF generated successfully', {
        templateId: request.metadata.template_id,
        sizeBytes: result.size_bytes,
        executionTimeMs: executionTime
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error('[SyncPdfService] PDF generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: executionTime
      });
      throw error;
    }
  }

  /**
   * Convert HTML to PDF using pdf-lib (Vercel-compatible)
   */
  private async convertHtmlToPdf(html: string): Promise<Buffer> {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      // Add a page
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      
      // Get fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Extract text content from HTML (simple parsing)
      const textContent = this.extractTextFromHtml(html);
      
      // Draw content on the page
      await this.drawContentOnPage(page, textContent, helveticaFont, helveticaBoldFont);
      
      // Serialize the PDF
      const pdfBytes = await pdfDoc.save();
      
      return Buffer.from(pdfBytes);
    } catch (error) {
      logger.error('[SyncPdfService] PDF generation with pdf-lib failed', { error });
      throw error;
    }
  }

  /**
   * Extract text content from HTML (simple parser)
   */
  private extractTextFromHtml(html: string): { title: string; sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> } {
    // Simple HTML parsing - extract key information
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/{{.*?}}/g, 'Generated Document') : 'DFSA Application';
    
    const sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> = [];
    
    // Extract sections
    const sectionMatches = html.match(/<div class="section"[^>]*>(.*?)<\/div>/gs);
    if (sectionMatches) {
      sectionMatches.forEach(sectionHtml => {
        const sectionTitleMatch = sectionHtml.match(/<div class="section-title"[^>]*>(.*?)<\/div>/i);
        const sectionTitle = sectionTitleMatch ? sectionTitleMatch[1] : 'Section';
        
        const fields: Array<{ label: string; value: string }> = [];
        const fieldMatches = sectionHtml.match(/<div class="field-group"[^>]*>(.*?)<\/div>/gs);
        
        if (fieldMatches) {
          fieldMatches.forEach(fieldHtml => {
            const labelMatch = fieldHtml.match(/<span class="field-label"[^>]*>(.*?)<\/span>/i);
            const valueMatch = fieldHtml.match(/<span class="field-value"[^>]*>(.*?)<\/span>/i);
            
            if (labelMatch && valueMatch) {
              fields.push({
                label: labelMatch[1].replace(':', ''),
                value: valueMatch[1].replace(/{{.*?}}/g, '[Value]')
              });
            }
          });
        }
        
        sections.push({ title: sectionTitle, fields });
      });
    }
    
    return { title, sections };
  }

  /**
   * Draw content on PDF page
   */
  private async drawContentOnPage(
    page: any, 
    content: { title: string; sections: Array<{ title: string; fields: Array<{ label: string; value: string }> }> },
    regularFont: any,
    boldFont: any
  ): Promise<void> {
    const { width, height } = page.getSize();
    let yPosition = height - 50;
    
    // Draw title
    page.drawText(content.title, {
      x: 50,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0)
    });
    yPosition -= 40;
    
    // Draw generation info
    const generationDate = new Date().toLocaleDateString();
    const generationTime = new Date().toLocaleTimeString();
    page.drawText(`Generated: ${generationDate} at ${generationTime}`, {
      x: 50,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });
    yPosition -= 30;
    
    // Draw sections
    for (const section of content.sections) {
      // Check if we need a new page
      if (yPosition < 100) {
        const newPage = page.doc.addPage([595.28, 841.89]);
        page = newPage;
        yPosition = height - 50;
      }
      
      // Draw section title
      page.drawText(section.title, {
        x: 50,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      yPosition -= 25;
      
      // Draw fields
      for (const field of section.fields) {
        if (yPosition < 50) {
          const newPage = page.doc.addPage([595.28, 841.89]);
          page = newPage;
          yPosition = height - 50;
        }
        
        // Draw field label and value
        page.drawText(`${field.label}:`, {
          x: 70,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: rgb(0, 0, 0)
        });
        
        page.drawText(field.value || '[Not provided]', {
          x: 200,
          y: yPosition,
          size: 12,
          font: regularFont,
          color: rgb(0, 0, 0)
        });
        
        yPosition -= 20;
      }
      
      yPosition -= 10; // Extra space between sections
    }
    
    // Draw footer
    page.drawText('This document was generated automatically by the DFSA PDF Service', {
      x: 50,
      y: 30,
      size: 10,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    });
  }

  /**
   * Generate HTML content from template and data
   */
  private async generateHtmlContent(request: PowerPagesPdfRequest): Promise<string> {
    const { user_info, form_data, metadata } = request;

    // Get template based on template_id
    const template = this.getTemplate(metadata.template_id);
    
    // Map form data to template variables
    const templateData = this.mapFormDataToTemplate(form_data.fields, user_info);

    // Replace template placeholders
    let htmlContent = template;
    
    // Replace user info
    htmlContent = htmlContent.replace(/{{user\.full_name}}/g, user_info.full_name);
    htmlContent = htmlContent.replace(/{{user\.email}}/g, user_info.email);
    
    // Replace form fields
    Object.entries(templateData).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(placeholder, String(value || ''));
    });

    // Replace metadata
    htmlContent = htmlContent.replace(/{{submission_id}}/g, form_data.submission_id);
    htmlContent = htmlContent.replace(/{{generation_date}}/g, new Date().toLocaleDateString());
    htmlContent = htmlContent.replace(/{{generation_time}}/g, new Date().toLocaleTimeString());

    return htmlContent;
  }

  /**
   * Get HTML template by template ID
   */
  private getTemplate(templateId: string): string {
    // Template mapping - in production, load from database or file system
    const templates: Record<string, string> = {
      'authorised-individual': this.getAuthorisedIndividualTemplate(),
      'application-form': this.getApplicationFormTemplate(),
      'default': this.getDefaultTemplate()
    };

    return templates[templateId] || templates['default'];
  }

  /**
   * Map form data fields to template variables
   */
  private mapFormDataToTemplate(fields: Record<string, any>, userInfo: any): Record<string, any> {
    // Standard field mappings
    const mappedData: Record<string, any> = {
      // Personal Information
      firstName: fields.firstName || fields.first_name || '',
      lastName: fields.lastName || fields.last_name || '',
      fullName: userInfo.full_name || `${fields.firstName || ''} ${fields.lastName || ''}`.trim(),
      email: userInfo.email || fields.email || '',
      phone: fields.phone || fields.phoneNumber || '',
      
      // Address Information
      address1: fields.address1 || fields.streetAddress || '',
      address2: fields.address2 || '',
      city: fields.city || '',
      state: fields.state || fields.province || '',
      postalCode: fields.postalCode || fields.zipCode || '',
      country: fields.country || '',
      
      // Application Details
      applicationDate: fields.applicationDate || new Date().toLocaleDateString(),
      applicationNumber: fields.applicationNumber || fields.referenceNumber || '',
      
      // Custom fields - pass through as-is
      ...fields
    };

    return mappedData;
  }

  /**
   * Authorised Individual template
   */
  private getAuthorisedIndividualTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Authorised Individual Application</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .field-group { margin-bottom: 15px; }
            .field-label { font-weight: bold; display: inline-block; width: 150px; }
            .field-value { display: inline-block; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>DFSA Authorised Individual Application</h1>
            <p>Application Reference: {{applicationNumber}}</p>
            <p>Generated: {{generation_date}} at {{generation_time}}</p>
        </div>

        <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="field-group">
                <span class="field-label">Full Name:</span>
                <span class="field-value">{{fullName}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Email:</span>
                <span class="field-value">{{email}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{phone}}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Address Information</div>
            <div class="field-group">
                <span class="field-label">Address:</span>
                <span class="field-value">{{address1}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">City:</span>
                <span class="field-value">{{city}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">State/Province:</span>
                <span class="field-value">{{state}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Postal Code:</span>
                <span class="field-value">{{postalCode}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Country:</span>
                <span class="field-value">{{country}}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Application Details</div>
            <div class="field-group">
                <span class="field-label">Application Date:</span>
                <span class="field-value">{{applicationDate}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Submission ID:</span>
                <span class="field-value">{{submission_id}}</span>
            </div>
        </div>

        <div class="footer">
            <p>This document was generated automatically by the DFSA PDF Service</p>
            <p>For questions, please contact support@dfsa.ae</p>
        </div>
    </body>
    </html>`;
  }

  /**
   * Generic application form template
   */
  private getApplicationFormTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Application Form</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .field-group { margin-bottom: 10px; }
            .field-label { font-weight: bold; display: inline-block; width: 150px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Application Form</h1>
            <p>Generated: {{generation_date}} at {{generation_time}}</p>
        </div>

        <div class="section">
            <div class="field-group">
                <span class="field-label">Name:</span>
                <span>{{fullName}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Email:</span>
                <span>{{email}}</span>
            </div>
            <div class="field-group">
                <span class="field-label">Submission ID:</span>
                <span>{{submission_id}}</span>
            </div>
        </div>
    </body>
    </html>`;
  }

  /**
   * Default template
   */
  private getDefaultTemplate(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Document</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Generated Document</h1>
            <p>User: {{user.full_name}} ({{user.email}})</p>
            <p>Generated: {{generation_date}} at {{generation_time}}</p>
            <p>Submission ID: {{submission_id}}</p>
        </div>
    </body>
    </html>`;
  }

  /**
   * Cleanup resources (no-op for Vercel deployment)
   */
  public async cleanup(): Promise<void> {
    logger.debug('[SyncPdfService] Cleanup called (no-op for serverless)');
  }
}