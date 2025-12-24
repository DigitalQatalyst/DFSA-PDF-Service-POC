/**
 * Email Service Orchestrator (Recommended Architecture)
 *
 * DEMO MODE: Using Resend as primary provider
 * - FOR DEMO: Resend is perfect for quick demos with modern API
 * - PRODUCTION: Use SendGrid (primary) + Amazon SES (fallback)
 *
 * Provider abstraction benefits:
 * ✅ Easy to swap providers (Resend ↔ SendGrid ↔ SES)
 * ✅ Fallback resilience for production
 * ✅ No vendor lock-in
 * ✅ Same interface regardless of provider
 */

import type { IEmailProvider, EmailPayload } from './IEmailProvider';
import { ResendProvider } from './providers/ResendProvider';
import { SendGridProvider } from './providers/SendGridProvider';
import { AmazonSESProvider } from './providers/AmazonSESProvider';

export { EmailPayload } from './IEmailProvider'; // Re-export for backward compatibility

export class EmailService {
  private primaryProvider: IEmailProvider;
  private fallbackProvider?: IEmailProvider;

  constructor() {
    // Try to initialize providers in priority order: Resend → SendGrid → SES
    let primaryInitialized = false;

    // Try Resend first (for demos)
    if (process.env.RESEND_API_KEY) {
      try {
        this.primaryProvider = new ResendProvider();
        console.log(`📧 Email Service initialized with primary provider: ${this.primaryProvider.name}`);
        primaryInitialized = true;
      } catch (error) {
        console.warn('⚠️ Failed to initialize Resend provider:', error);
      }
    }

    // Try SendGrid if Resend not available
    if (!primaryInitialized && process.env.SENDGRID_API_KEY) {
      try {
        this.primaryProvider = new SendGridProvider();
        console.log(`📧 Email Service initialized with primary provider: ${this.primaryProvider.name}`);
        primaryInitialized = true;
      } catch (error) {
        console.warn('⚠️ Failed to initialize SendGrid provider:', error);
      }
    }

    // Try Amazon SES if neither Resend nor SendGrid available
    if (!primaryInitialized && process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY) {
      try {
        this.primaryProvider = new AmazonSESProvider();
        console.log(`📧 Email Service initialized with primary provider: ${this.primaryProvider.name}`);
        primaryInitialized = true;
      } catch (error) {
        console.warn('⚠️ Failed to initialize Amazon SES provider:', error);
      }
    }

    // Throw error if no primary provider available
    if (!primaryInitialized) {
      throw new Error('Email service initialization failed: No email provider configured (set RESEND_API_KEY, SENDGRID_API_KEY, or AWS_SES credentials)');
    }

    // Initialize fallback provider (optional) - try providers not already used
    if (this.primaryProvider.name !== 'Amazon SES' && process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY) {
      try {
        this.fallbackProvider = new AmazonSESProvider();
        console.log(`📧 Email Service fallback provider available: ${this.fallbackProvider.name}`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize fallback email provider (Amazon SES):', error);
      }
    } else if (this.primaryProvider.name !== 'SendGrid' && process.env.SENDGRID_API_KEY) {
      try {
        this.fallbackProvider = new SendGridProvider();
        console.log(`📧 Email Service fallback provider available: ${this.fallbackProvider.name}`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize fallback email provider (SendGrid):', error);
      }
    }

    if (!this.fallbackProvider) {
      console.log('ℹ️ No fallback email provider configured (optional but recommended for production)');
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
