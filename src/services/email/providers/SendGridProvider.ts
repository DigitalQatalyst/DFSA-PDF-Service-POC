/**
 * SendGrid Email Provider
 *
 * WHY SENDGRID (vs Resend):
 * ✅ Enterprise compliance: GDPR (DPA), HIPAA (BAA), SOC 2
 * ✅ 99.95% SLA (vs no SLA for Resend)
 * ✅ Dedicated IPs for deliverability
 * ✅ Trusted by healthcare, finance, government sectors
 * ✅ Transparent enterprise pricing
 * ✅ Comprehensive delivery analytics
 * ✅ Azure-native SDK integration
 *
 * Production setup required:
 * 1. Create SendGrid account (https://sendgrid.com)
 * 2. Verify sender domain (dfsa.ae) via DNS records (SPF, DKIM, DMARC)
 * 3. Generate API key (https://app.sendgrid.com/settings/api_keys)
 * 4. Set SENDGRID_API_KEY and EMAIL_FROM environment variables
 */

import sgMail from '@sendgrid/mail';
import type { IEmailProvider, EmailPayload, EmailResult } from '../IEmailProvider.js';

export class SendGridProvider implements IEmailProvider {
  name = 'SendGrid';
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }

    if (!fromEmail) {
      throw new Error('EMAIL_FROM environment variable is required');
    }

    this.apiKey = apiKey;
    this.fromEmail = fromEmail;

    // Configure SendGrid
    sgMail.setApiKey(this.apiKey);

    console.log(`📧 SendGrid provider initialized (Enterprise-grade email delivery)`);
  }

  /**
   * Send email with PDF attachment via SendGrid
   *
   * PRESERVED from original emailService.ts:
   * - Email template HTML generation
   * - PDF attachment handling
   * - Error messages and logging patterns
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    try {
      console.log(`📧 [SendGrid] Sending PDF to: ${payload.recipientEmail}`);

      const fileName = `DFSA_Application_${payload.applicationId}.pdf`;

      const emailData: sgMail.MailDataRequired = {
        from: this.fromEmail,
        to: payload.recipientEmail,
        cc: payload.ccEmails && payload.ccEmails.length > 0 ? payload.ccEmails : undefined,
        subject: `DFSA Authorised Individual Application - ${payload.applicantName}`,
        html: this.generateEmailTemplate(payload),
        attachments: [
          {
            filename: fileName,
            content: payload.pdfBuffer.toString('base64'),
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      };

      console.log('📤 [SendGrid] Sending email via API...');
      const response = await sgMail.send(emailData);

      // SendGrid returns array of responses (one per recipient)
      const emailId = response[0].headers['x-message-id'] as string || 'unknown';

      console.log(`✅ [SendGrid] PDF emailed successfully`);
      console.log(`📧 [SendGrid] Email ID: ${emailId}`);
      console.log(`📧 [SendGrid] Recipients: ${payload.recipientEmail}`);
      if (payload.ccEmails && payload.ccEmails.length > 0) {
        console.log(`📧 [SendGrid] CC Recipients: ${payload.ccEmails.join(', ')}`);
      }

      return {
        success: true,
        emailId: emailId
      };

    } catch (error: any) {
      console.error('❌ [SendGrid] Email sending failed:', error);

      // Provide specific error messages for SendGrid issues
      let errorMessage = 'Unknown error';

      if (error.response) {
        const body = error.response.body;
        errorMessage = body.errors ? body.errors.map((e: any) => e.message).join(', ') : body.message || 'SendGrid API error';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Map common SendGrid errors to user-friendly messages
      if (errorMessage.includes('Invalid API key')) {
        errorMessage = 'Invalid SendGrid API key. Please check your SENDGRID_API_KEY environment variable.';
      } else if (errorMessage.includes('does not contain a valid address')) {
        errorMessage = 'Invalid email address format. Please check recipient email.';
      } else if (errorMessage.includes('domain not verified')) {
        errorMessage = 'Sender domain not verified in SendGrid. Please verify your domain.';
      }

      return {
        success: false,
        error: `SendGrid delivery failed: ${errorMessage}`
      };
    }
  }

  /**
   * Health check - verify SendGrid is configured correctly
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple check: API key is set and formatted correctly
      if (!this.apiKey || !this.apiKey.startsWith('SG.')) {
        console.warn('⚠️ [SendGrid] Invalid API key format');
        return false;
      }

      // Note: SendGrid doesn't have a dedicated health check endpoint
      // We assume healthy if API key is properly formatted
      return true;
    } catch (error) {
      console.error('❌ [SendGrid] Health check failed:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template
   *
   * PRESERVED: 100% unchanged from original emailService.ts
   * DFSA branding colors maintained: #B82933 (red), #A39043 (gold)
   */
  private generateEmailTemplate(payload: EmailPayload): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DFSA Application PDF</title>
        <style>
          body {
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
            color: #333333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #B82933;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border: 1px solid #e0e0e0;
            border-top: none;
          }
          .highlight {
            background-color: #ffffff;
            padding: 15px;
            margin: 20px 0;
            border-left: 4px solid #A39043;
          }
          .footer {
            text-align: center;
            padding: 20px;
            font-size: 12px;
            color: #666666;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #B82933;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DFSA Application PDF</h1>
        </div>

        <div class="content">
          <p>Dear ${payload.applicantName},</p>

          <p>Your DFSA Authorised Individual Application has been generated and is attached to this email as a PDF document.</p>

          <div class="highlight">
            <strong>Application Details:</strong><br>
            Application ID: <strong>${payload.applicationId}</strong><br>
            Generated on: <strong>${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })}</strong>
          </div>

          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Review the attached PDF for accuracy</li>
            <li>Print and sign where indicated</li>
            <li>Submit the signed application to DFSA</li>
          </ul>

          <p>If you have any questions or notice any discrepancies, please contact your requestor:</p>
          <p><strong>Requestor Email:</strong> ${payload.requestorEmail}</p>

          <p>Thank you for using the DFSA PDF Service.</p>
        </div>

        <div class="footer">
          <p>This is an automated email from the DFSA PDF Service.</p>
          <p style="color: #A39043;">Powered by SendGrid - Enterprise Email Delivery</p>
        </div>
      </body>
      </html>
    `;
  }
}
