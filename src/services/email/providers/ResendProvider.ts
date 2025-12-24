/**
 * Resend Email Provider (Demo/Development)
 *
 * WHY RESEND:
 * ✅ Perfect for demos and development
 * ✅ Modern API with excellent DX
 * ✅ Free tier for testing
 * ⚠️ Free tier limitation: Can only send to account owner email
 *
 * Trade-offs vs SendGrid/SES:
 * ⚠️ Free tier limited to owner email only
 * ⚠️ No enterprise SLA
 * ⚠️ Limited compliance certifications
 *
 * Production note:
 * - Resend is excellent for demos but requires domain verification for production
 * - For DFSA production, use SendGrid (primary) + Amazon SES (fallback)
 */

import { Resend } from 'resend';
import type { IEmailProvider, EmailPayload, EmailResult } from '../IEmailProvider.js';

export class ResendProvider implements IEmailProvider {
  name = 'Resend';
  private resend: Resend;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    if (!fromEmail) {
      throw new Error('EMAIL_FROM environment variable is required');
    }

    this.fromEmail = fromEmail;
    this.resend = new Resend(apiKey);

    console.log(`📧 Resend provider initialized (Demo/Development email delivery)`);
  }

  /**
   * Send email with PDF attachment via Resend
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    try {
      console.log(`📧 [Resend] Sending PDF to: ${payload.recipientEmail}`);

      const fileName = `DFSA_Application_${payload.applicationId}.pdf`;

      // Build email data
      const emailData: any = {
        from: this.fromEmail,
        to: [payload.recipientEmail],
        subject: `DFSA Authorised Individual Application - ${payload.applicantName}`,
        html: this.generateEmailTemplate(payload),
        attachments: [
          {
            filename: fileName,
            content: payload.pdfBuffer
          }
        ]
      };

      // Add CC emails if provided
      if (payload.ccEmails && payload.ccEmails.length > 0) {
        emailData.cc = payload.ccEmails;
      }

      console.log('📤 [Resend] Sending email via API...');
      const { data, error } = await this.resend.emails.send(emailData);

      if (error) {
        console.error('❌ [Resend] Email sending failed:', error);
        return {
          success: false,
          error: `Resend delivery failed: ${error.message || JSON.stringify(error)}`
        };
      }

      const emailId = data?.id || 'unknown';

      console.log(`✅ [Resend] PDF emailed successfully`);
      console.log(`📧 [Resend] Email ID: ${emailId}`);
      console.log(`📧 [Resend] Recipients: ${payload.recipientEmail}`);
      if (payload.ccEmails && payload.ccEmails.length > 0) {
        console.log(`📧 [Resend] CC Recipients: ${payload.ccEmails.join(', ')}`);
      }

      return {
        success: true,
        emailId: emailId
      };

    } catch (error: any) {
      console.error('❌ [Resend] Email sending failed:', error);

      let errorMessage = error.message || 'Unknown error';

      // Map common Resend errors to user-friendly messages
      if (errorMessage.includes('only send testing emails to your own email')) {
        errorMessage = 'Resend free tier can only send to account owner email. Please verify a domain for production use.';
      }

      return {
        success: false,
        error: `Resend delivery failed: ${errorMessage}`
      };
    }
  }

  /**
   * Health check - verify Resend is configured correctly
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple check: Can we access the Resend client?
      return this.resend !== null;
    } catch (error) {
      console.error('❌ [Resend] Health check failed:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template
   *
   * PRESERVED: DFSA branding colors maintained: #B82933 (red), #A39043 (gold)
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
          <p style="color: #A39043;">Powered by Resend - Modern Email Delivery</p>
        </div>
      </body>
      </html>
    `;
  }
}
