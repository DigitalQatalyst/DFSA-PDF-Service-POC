/**
 * Email Provider Interface
 *
 * WHY THIS ABSTRACTION:
 * - Enterprise requirements demand provider flexibility (SendGrid today, others tomorrow)
 * - Fallback resilience (SendGrid → Amazon SES if primary fails)
 * - Regulatory compliance (GDPR, HIPAA require specific providers)
 * - No vendor lock-in
 */

export interface EmailPayload {
  recipientEmail: string;
  applicantName: string;
  applicationId: string;
  requestorEmail: string;
  pdfBuffer: Buffer;
  ccEmails?: string[];
}

export interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Provider interface - all email providers must implement this
 */
export interface IEmailProvider {
  /**
   * Provider name for logging and debugging
   */
  name: string;

  /**
   * Send email with PDF attachment
   *
   * @param payload - Email details and PDF buffer
   * @returns Promise<EmailResult> - Success status and email ID
   * @throws Error if email sending fails
   */
  sendEmail(payload: EmailPayload): Promise<EmailResult>;

  /**
   * Health check - verify provider is configured and accessible
   *
   * @returns Promise<boolean> - True if provider is healthy
   */
  isHealthy(): Promise<boolean>;
}
