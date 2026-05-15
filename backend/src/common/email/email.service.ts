import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend | null = null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress = 'Handmade.net <noreply@handmade.net>';
  private readonly frontendUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will only be logged to console');
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/verify-email?token=${token}`;

    if (!this.resend) {
      this.logger.log(`[DEV] Verification email for ${email}: ${url}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      subject: 'Ověřte svůj email — Handmade.net',
      html: this.buildVerificationHtml(url),
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const url = `${this.frontendUrl}/reset-password?token=${token}`;

    if (!this.resend) {
      this.logger.log(`[DEV] Password reset email for ${email}: ${url}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromAddress,
      to: email,
      subject: 'Reset hesla — Handmade.net',
      html: this.buildPasswordResetHtml(url),
    });
  }

  private buildVerificationHtml(url: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'DM Sans', Arial, sans-serif; background: #f8f4f0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff8f2; border-radius: 12px; padding: 40px; border: 1px solid #e8ddd0;">
          <h1 style="color: #3d2b1f; font-family: Georgia, serif; font-size: 28px; margin-bottom: 8px;">
            Vítejte v Handmade.net
          </h1>
          <p style="color: #7a5c4a; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Pro dokončení registrace potvrďte svůj email kliknutím na tlačítko níže.
          </p>
          <a href="${url}" style="display: inline-block; background: #00CED1; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Ověřit email
          </a>
          <p style="color: #a08070; font-size: 13px; margin-top: 32px; line-height: 1.5;">
            Odkaz je platný 24 hodin. Pokud jste se neregistrovali na Handmade.net, tento email ignorujte.
          </p>
          <hr style="border: none; border-top: 1px solid #e8ddd0; margin: 32px 0;">
          <p style="color: #a08070; font-size: 12px;">
            Handmade.net — Optimalizační nástroj pro handmade výrobce
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private buildPasswordResetHtml(url: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'DM Sans', Arial, sans-serif; background: #f8f4f0; padding: 40px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff8f2; border-radius: 12px; padding: 40px; border: 1px solid #e8ddd0;">
          <h1 style="color: #3d2b1f; font-family: Georgia, serif; font-size: 28px; margin-bottom: 8px;">
            Reset hesla
          </h1>
          <p style="color: #7a5c4a; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
            Obdrželi jsme žádost o reset hesla k vašemu účtu. Klikněte na tlačítko níže pro nastavení nového hesla.
          </p>
          <a href="${url}" style="display: inline-block; background: #00CED1; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
            Nastavit nové heslo
          </a>
          <p style="color: #a08070; font-size: 13px; margin-top: 32px; line-height: 1.5;">
            Odkaz je platný 1 hodinu. Pokud jste o reset hesla nežádali, tento email ignorujte — váš účet je v bezpečí.
          </p>
          <hr style="border: none; border-top: 1px solid #e8ddd0; margin: 32px 0;">
          <p style="color: #a08070; font-size: 12px;">
            Handmade.net — Optimalizační nástroj pro handmade výrobce
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
