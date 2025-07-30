import { v4 as uuidv4 } from 'uuid';

export class EmailUtils {
  /**
   * Generate a verification token
   * @returns Verification token
   */
  static generateVerificationToken(): string {
    return uuidv4();
  }

  /**
   * Generate verification email content
   * @param providerName - Provider's full name
   * @param verificationToken - Verification token
   * @param baseUrl - Application base URL
   * @returns Email content
   */
  static generateVerificationEmail(
    providerName: string,
    verificationToken: string,
    baseUrl: string
  ): { subject: string; html: string; text: string } {
    const verificationUrl = `${baseUrl}/api/v1/provider/verify/${verificationToken}`;
    
    const subject = 'Verify Your Provider Account - IMH HealthCare';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Provider Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f8f9fa; }
          .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>IMH HealthCare</h1>
            <h2>Verify Your Provider Account</h2>
          </div>
          <div class="content">
            <p>Dear ${providerName},</p>
            <p>Thank you for registering as a healthcare provider with IMH HealthCare. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p>${verificationUrl}</p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 IMH HealthCare. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    const text = `
      Verify Your Provider Account - IMH HealthCare
      
      Dear ${providerName},
      
      Thank you for registering as a healthcare provider with IMH HealthCare. To complete your registration, please verify your email address by visiting the following link:
      
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      © 2024 IMH HealthCare. All rights reserved.
    `;
    
    return { subject, html, text };
  }

  /**
   * Sanitize email input
   * @param email - Email to sanitize
   * @returns Sanitized email
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Validate email format
   * @param email - Email to validate
   * @returns True if email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 