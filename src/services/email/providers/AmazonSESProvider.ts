/**
 * Amazon SES Email Provider (Fallback)
 *
 * WHY AMAZON SES:
 * ✅ Best value: $0.10 per 1,000 emails (lowest cost at scale)
 * ✅ AWS compliance: GDPR, HIPAA, SOC 2 via AWS infrastructure
 * ✅ Unmatched reliability: AWS-grade 99.99% uptime
 * ✅ Ideal fallback if SendGrid unavailable
 *
 * Trade-offs vs SendGrid:
 * ⚠️ More manual configuration (bounce handling, analytics)
 * ⚠️ Basic analytics (requires CloudWatch setup)
 * ⚠️ Cross-cloud complexity (AWS SDK in Azure environment)
 *
 * Production setup required:
 * 1. Create AWS account
 * 2. Verify sender domain in SES console
 * 3. Request production access (move out of sandbox)
 * 4. Create IAM user with SES permissions
 * 5. Set AWS_SES_REGION, AWS_SES_ACCESS_KEY_ID, AWS_SES_SECRET_ACCESS_KEY
 */

import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import type { IEmailProvider, EmailPayload, EmailResult } from '../IEmailProvider.js';

export class AmazonSESProvider implements IEmailProvider {
  name = 'Amazon SES';
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    const region = process.env.AWS_SES_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY;
    const fromEmail = process.env.EMAIL_FROM;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS_SES_ACCESS_KEY_ID and AWS_SES_SECRET_ACCESS_KEY environment variables are required');
    }

    if (!fromEmail) {
      throw new Error('EMAIL_FROM environment variable is required');
    }

    this.fromEmail = fromEmail;

    // Initialize SES client
    this.sesClient = new SESClient({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
      }
    });

    console.log(`📧 Amazon SES provider initialized (Fallback email delivery, region: ${region})`);
  }

  /**
   * Send email with PDF attachment via Amazon SES
   *
   * Note: SES requires raw email format for attachments
   */
  async sendEmail(payload: EmailPayload): Promise<EmailResult> {
    try {
      console.log(`📧 [Amazon SES] Sending PDF to: ${payload.recipientEmail}`);

      const fileName = `DFSA_Application_${payload.applicationId}.pdf`;

      // Build raw email with MIME multipart format
      const rawEmail = this.buildRawEmail(payload, fileName);

      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawEmail)
        }
      });

      console.log('📤 [Amazon SES] Sending email via API...');
      const response = await this.sesClient.send(command);

      const emailId = response.MessageId || 'unknown';

      console.log(`✅ [Amazon SES] PDF emailed successfully`);
      console.log(`📧 [Amazon SES] Message ID: ${emailId}`);
      console.log(`📧 [Amazon SES] Recipients: ${payload.recipientEmail}`);
      if (payload.ccEmails && payload.ccEmails.length > 0) {
        console.log(`📧 [Amazon SES] CC Recipients: ${payload.ccEmails.join(', ')}`);
      }

      return {
        success: true,
        emailId: emailId
      };

    } catch (error: any) {
      console.error('❌ [Amazon SES] Email sending failed:', error);

      let errorMessage = error.message || 'Unknown error';

      // Map common SES errors to user-friendly messages
      if (errorMessage.includes('Email address is not verified')) {
        errorMessage = 'Email address not verified in Amazon SES. Please verify your sender domain.';
      } else if (errorMessage.includes('Daily message quota')) {
        errorMessage = 'Amazon SES daily quota exceeded. Please request quota increase.';
      } else if (errorMessage.includes('Account is in sandbox mode')) {
        errorMessage = 'Amazon SES account in sandbox mode. Please request production access.';
      }

      return {
        success: false,
        error: `Amazon SES delivery failed: ${errorMessage}`
      };
    }
  }

  /**
   * Health check - verify SES is configured correctly
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Simple check: Can we create an SES client?
      // A more thorough check would require calling getSendQuota()
      return this.sesClient !== null;
    } catch (error) {
      console.error('❌ [Amazon SES] Health check failed:', error);
      return false;
    }
  }

  /**
   * Build raw MIME email with PDF attachment
   *
   * SES requires raw email format for attachments
   */
  private buildRawEmail(payload: EmailPayload, fileName: string): string {
    const boundary = `----=_Part_${Date.now()}`;
    const pdfBase64 = payload.pdfBuffer.toString('base64');

    const recipients = [payload.recipientEmail];
    if (payload.ccEmails && payload.ccEmails.length > 0) {
      recipients.push(...payload.ccEmails);
    }

    const rawEmail = [
      `From: ${this.fromEmail}`,
      `To: ${payload.recipientEmail}`,
      payload.ccEmails && payload.ccEmails.length > 0 ? `Cc: ${payload.ccEmails.join(', ')}` : '',
      `Subject: DFSA Authorised Individual Application - ${payload.applicantName}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      this.generateEmailTemplate(payload),
      '',
      `--${boundary}`,
      'Content-Type: application/pdf',
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${fileName}"`,
      '',
      pdfBase64,
      '',
      `--${boundary}--`
    ].filter(line => line !== null).join('\r\n');

    return rawEmail;
  }

  /**
   * Generate HTML email template
   *
   * PRESERVED: 100% unchanged from SendGridProvider
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
          <p style="color: #A39043;">Powered by Amazon SES - Reliable Fallback Delivery</p>
        </div>
      </body>
      </html>
    `;
  }
}
