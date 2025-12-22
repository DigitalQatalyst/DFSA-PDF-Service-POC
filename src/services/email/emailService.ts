import { Resend } from 'resend';
import type { AuthorisedIndividualDTO } from '../../types/authorisedIndividual.js';

export interface EmailPayload {
  recipientEmail: string;
  applicantName: string;
  applicationId: string;
  requestorEmail: string;
  pdfBuffer: Buffer;
  ccEmails?: string[];
}

export class EmailService {
  private resend: Resend;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('❌ RESEND_API_KEY environment variable is required');
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    try {
      this.resend = new Resend(apiKey);
      console.log('📧 Resend email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Resend:', error);
      throw new Error(`Failed to initialize Resend: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send PDF application via email using Resend
   */
  async sendApplicationPDF(payload: EmailPayload): Promise<void> {
    try {
      console.log(`📧 Sending PDF via Resend to: ${payload.recipientEmail}`);

      const fileName = `DFSA_Application_${payload.applicationId}.pdf`;
      const pdfBase64 = payload.pdfBuffer.toString('base64');

      // Prepare recipients
      const recipients = [payload.recipientEmail];
      const ccRecipients = payload.ccEmails || [];

      const emailData = {
        from: process.env.EMAIL_FROM || 'DFSA PDF Service <noreply@dfsa.ae>',
        to: recipients,
        cc: ccRecipients.length > 0 ? ccRecipients : undefined,
        subject: `DFSA Authorised Individual Application - ${payload.applicantName}`,
        html: this.generateEmailTemplate(payload),
        attachments: [
          {
            filename: fileName,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ]
      };

      console.log('📤 Sending email via Resend API...');
      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      console.log(`✅ PDF emailed successfully via Resend`);
      console.log(`📧 Email ID: ${result.data?.id}`);
      console.log(`📧 Recipients: ${recipients.join(', ')}`);
      if (ccRecipients.length > 0) {
        console.log(`📧 CC Recipients: ${ccRecipients.join(', ')}`);
      }

    } catch (error) {
      console.error('❌ Resend email sending failed:', error);

      // Provide specific error messages for Resend issues
      if (error instanceof Error) {
        if (error.message.includes('Invalid API key')) {
          throw new Error('Email delivery failed: Invalid Resend API key. Please check your RESEND_API_KEY environment variable.');
        } else if (error.message.includes('Domain not verified')) {
          throw new Error('Email delivery failed: Domain not verified in Resend. Please verify your sending domain.');
        } else if (error.message.includes('Rate limit')) {
          throw new Error('Email delivery failed: Resend rate limit exceeded. Please try again later.');
        }
      }

      throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notification email to requestor using Resend
   */
  async sendNotificationEmail(options: {
    recipientEmail: string;
    applicantName: string;
    applicationId: string;
    status: 'sent' | 'error';
    errorMessage?: string;
  }): Promise<void> {
    try {
      const isSuccess = options.status === 'sent';

      const emailData = {
        from: process.env.EMAIL_FROM || 'DFSA PDF Service <noreply@dfsa.ae>',
        to: [options.recipientEmail],
        subject: `DFSA Application ${isSuccess ? 'Delivered' : 'Delivery Failed'} - ${options.applicationId}`,
        html: this.generateNotificationTemplate(options)
      };

      const result = await this.resend.emails.send(emailData);

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      console.log(`📬 Notification sent via Resend to: ${options.recipientEmail}`);

    } catch (error) {
      console.error('❌ Resend notification email failed:', error);
      throw error;
    }
  }

  /**
   * Test Resend connection and API key
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 Testing Resend API connection...');

      // Test with a simple API call to check if the key is valid
      const result = await this.resend.emails.send({
        from: process.env.EMAIL_FROM || 'DFSA PDF Service <noreply@dfsa.ae>',
        to: ['test@resend.dev'], // Resend's test email
        subject: 'DFSA PDF Service - Connection Test',
        html: '<p>This is a connection test from DFSA PDF Service.</p>'
      });

      if (result.error) {
        console.error('❌ Resend connection test failed:', result.error);
        return false;
      }

      console.log('✅ Resend connection test successful');
      return true;

    } catch (error) {
      console.error('❌ Resend connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate professional email template
   */
  private generateEmailTemplate(payload: EmailPayload): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DFSA Authorised Individual Application</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #B82933 0%, #A39043 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .details-box {
            background-color: #f8f9fa;
            border-left: 4px solid #B82933;
            padding: 20px;
            margin: 20px 0;
          }
          .details-box ul {
            margin: 0;
            padding-left: 20px;
          }
          .details-box li {
            margin: 8px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e9ecef;
          }
          .highlight {
            color: #B82933;
            font-weight: 600;
          }
          .signature {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DFSA Authorised Individual Application</h1>
          </div>
          <div class="content">
            <p>Dear Recipient,</p>

            <p>Please find attached the DFSA Authorised Individual Application for <span class="highlight">${payload.applicantName}</span>.</p>

            <div class="details-box">
              <p><strong>Application Details:</strong></p>
              <ul>
                <li><strong>Application ID:</strong> ${payload.applicationId}</li>
                <li><strong>Applicant Name:</strong> ${payload.applicantName}</li>
                <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
                <li><strong>Document Format:</strong> PDF</li>
              </ul>
            </div>

            <p>The PDF document contains all the required information for the DFSA Authorised Individual application process, including:</p>
            <ul>
              <li>Personal and professional details</li>
              <li>Regulatory history and qualifications</li>
              <li>Supporting documentation references</li>
            </ul>

            <p>If you have any questions regarding this application, please contact the requestor at: <a href="mailto:${payload.requestorEmail}" style="color: #B82933;">${payload.requestorEmail}</a></p>

            <div class="signature">
              <p>Best regards,<br>
              <strong>DFSA PDF Service</strong><br>
              <em>Automated Document Generation System</em></p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated message from the DFSA PDF Service. Please do not reply to this email.</p>
            <p>Powered by Resend • Generated on ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate notification email template
   */
  private generateNotificationTemplate(options: {
    applicantName: string;
    applicationId: string;
    status: 'sent' | 'error';
    errorMessage?: string;
  }): string {
    const isSuccess = options.status === 'sent';
    const statusColor = isSuccess ? '#28a745' : '#dc3545';
    const statusText = isSuccess ? 'Delivered Successfully' : 'Delivery Failed';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DFSA Application ${statusText}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background-color: ${statusColor};
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px 20px;
          }
          .status-box {
            background-color: ${isSuccess ? '#d4edda' : '#f8d7da'};
            border: 1px solid ${isSuccess ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 4px;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e9ecef;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application ${statusText}</h1>
          </div>
          <div class="content">
            <p>Dear Requestor,</p>

            <div class="status-box">
              ${isSuccess ? `
                <p><strong>✅ Success!</strong> The DFSA Authorised Individual Application for <strong>${options.applicantName}</strong> has been successfully generated and delivered via email.</p>
                <p><strong>Application ID:</strong> ${options.applicationId}</p>
                <p>The PDF document has been sent to the specified recipients and is ready for processing.</p>
              ` : `
                <p><strong>❌ Delivery Failed</strong> There was an issue delivering the DFSA Authorised Individual Application for <strong>${options.applicantName}</strong>.</p>
                <p><strong>Application ID:</strong> ${options.applicationId}</p>
                <p><strong>Error Details:</strong> ${options.errorMessage || 'Unknown error occurred'}</p>
                <p>Please contact technical support for assistance or try submitting the application again.</p>
              `}
            </div>

            <p>Best regards,<br>
            <strong>DFSA PDF Service</strong><br>
            <em>Automated Document Generation System</em></p>
          </div>
          <div class="footer">
            <p>This is an automated notification from the DFSA PDF Service.</p>
            <p>Powered by Resend • ${new Date().toISOString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}
