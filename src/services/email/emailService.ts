/**
 * Email Service Orchestrator (Recommended Architecture)
 *
 * MIGRATION NOTE: Resend → SendGrid + Amazon SES fallback
 * - WHY CHANGED: Enterprise compliance (GDPR, HIPAA, SOC 2), 99.95% SLA, dedicated IPs
 * - WHAT PRESERVED: EmailPayload interface, email template HTML, PDF attachment handling
 * - NEW FEATURE: Automatic fallback to Amazon SES if SendGrid fails
 *
 * Production benefits:
 * ✅ Provider abstraction (easy to swap providers)
 * ✅ Fallback resilience (SendGrid → SES if primary fails)
 * ✅ No vendor lock-in
 * ✅ Regulatory compliance ready
 * ✅ Enterprise support contracts available
 */

import type { IEmailProvider, EmailPayload } from './IEmailProvider.js';
import { SendGridProvider } from './providers/SendGridProvider.js';
import { AmazonSESProvider } from './providers/AmazonSESProvider.js';

export { EmailPayload } from './IEmailProvider.js'; // Re-export for backward compatibility

export class EmailService {
  private primaryProvider: IEmailProvider;
  private fallbackProvider?: IEmailProvider;

  constructor() {
    // Initialize primary provider (SendGrid)
    try {
      this.primaryProvider = new SendGridProvider();
      console.log(`📧 Email Service initialized with primary provider: ${this.primaryProvider.name}`);
    } catch (error) {
      console.error('❌ Failed to initialize primary email provider (SendGrid):', error);
      throw new Error('Email service initialization failed: SendGrid not configured');
    }

    // Initialize fallback provider (Amazon SES) - optional
    try {
      if (process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY) {
        this.fallbackProvider = new AmazonSESProvider();
        console.log(`📧 Email Service fallback provider available: ${this.fallbackProvider.name}`);
      } else {
        console.log('ℹ️ Amazon SES fallback not configured (optional)');
      }
    } catch (error) {
      console.warn('⚠️ Failed to initialize fallback email provider (Amazon SES):', error);
      console.log('ℹ️ Service will continue without fallback (SendGrid only)');
    }
  }

  /**
   * Send application PDF via email
   *
   * PRESERVED INTERFACE: Public method signature unchanged from original emailService.ts
   * Handlers can call this method without modification
   *
   * NEW BEHAVIOR: Automatic fallback to Amazon SES if SendGrid fails
   */
  async sendApplicationPDF(payload: EmailPayload): Promise<void> {
    try {
      // Try primary provider (SendGrid)
      const result = await this.primaryProvider.sendEmail(payload);

      if (result.success) {
        console.log(`✅ Email sent successfully via ${this.primaryProvider.name}`);
        return; // Success!
      }

      // Primary failed, try fallback if available
      if (this.fallbackProvider) {
        console.warn(`⚠️ Primary provider failed, attempting fallback to ${this.fallbackProvider.name}`);
        const fallbackResult = await this.fallbackProvider.sendEmail(payload);

        if (fallbackResult.success) {
          console.log(`✅ Email sent successfully via fallback provider: ${this.fallbackProvider.name}`);
          return; // Fallback success!
        }

        // Both failed
        throw new Error(`Email delivery failed: Both ${this.primaryProvider.name} and ${this.fallbackProvider.name} failed`);
      }

      // Primary failed and no fallback available
      throw new Error(`Email delivery failed: ${result.error || 'Unknown error'}`);

    } catch (error) {
      console.error('❌ Email delivery failed (all providers):', error);
      throw new Error(`Email delivery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send notification email to requestor
   *
   * PRESERVED: For future use (not currently called by handlers)
   */
  async sendNotificationEmail(options: {
    recipientEmail: string;
    applicantName: string;
    applicationId: string;
    pdfUrl: string;
  }): Promise<void> {
    // Future implementation: Send notification without PDF attachment
    console.log('ℹ️ Notification emails not yet implemented');
  }
}
