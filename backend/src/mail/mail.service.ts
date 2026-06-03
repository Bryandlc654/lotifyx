import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>("SMTP_HOST", "smtp.gmail.com"),
      port: config.get<number>("SMTP_PORT", 587),
      secure: false,
      auth: {
        user: config.get<string>("SMTP_USER", ""),
        pass: config.get<string>("SMTP_PASS", ""),
      },
    });
  }

  async sendVerificationCode(to: string, code: string, name: string) {
    const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
    const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "noreply@lotifyx.com");

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "Verifica tu cuenta - Lotifyx",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">¡Bienvenido a Lotifyx, ${name}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Gracias por registrarte. Usa el siguiente código para verificar tu cuenta:
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;text-align:center;margin:20px 0">
            <span style="font-size:28px;font-weight:700;letter-spacing:6px;color:#1e293b">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;">
            Este código expira en 15 minutos. Si no solicitaste esta cuenta, ignora este mensaje.
          </p>
        </div>
      `,
    });
  }
}
