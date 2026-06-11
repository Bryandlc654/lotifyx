import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(
    private config: ConfigService,
    private settings: SettingsService
  ) {
    this.transporter = nodemailer.createTransport({});
  }

  async onModuleInit() {
    await this.reloadTransporter();
  }

  async reloadTransporter() {
    const host = await this.settings.get("smtp_host");
    const port = parseInt((await this.settings.get("smtp_port")) || "587");
    const user = await this.settings.get("smtp_user");
    const pass = await this.settings.get("smtp_pass");

    if (!host || !user || !pass) {
      console.warn("[MailService] SMTP no configurado en panel admin. Los correos no se enviarán.");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    console.log(`[MailService] Transporter configurado: ${host}:${port} (secure: ${port === 465})`);
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
