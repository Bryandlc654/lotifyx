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
      console.warn("[MailService] SMTP no configurado. Ve a Admin > Configuración para configurarlo.");
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

    const host = (this.transporter as any)?.options?.host || "no configurado";
    console.log(`[MailService] Enviando código a ${to} via ${host}`);

    try {
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
      console.log(`[MailService] Correo enviado a ${to}`);
    } catch (err: any) {
      console.error(`[MailService] Error enviando correo a ${to}:`, err?.message, err?.code);
      throw err;
    }
  }

  async sendNewsletterConfirmation(to: string, name: string | undefined) {
    const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
    const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "noreply@lotifyx.com");
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const unsubscribeUrl = `${frontendUrl}/newsletter/cancelar`;
    const displayName = name || "suscriptor";

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "¡Gracias por suscribirte! - Lotifyx",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">¡Gracias por suscribirte, ${displayName}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            A partir de ahora recibirás en tu correo las mejores ofertas, novedades y contenido exclusivo de Lotifyx.
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;margin:20px 0">
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.6">✅ Ofertas y descuentos exclusivos<br>🆕 Nuevos productos y lanzamientos<br>📚 Guías y consejos de comercio electrónico<br>🔔 Novedades de la plataforma</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;">
            Si deseas dejar de recibir nuestros correos, puedes <a href="${unsubscribeUrl}" style="color:#8234FE;text-decoration:underline">cancelar tu suscripción aquí</a>.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, token: string, name: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"Lotifyx" <${this.config.get("SMTP_FROM_EMAIL", "noreply@lotifyx.com")}>`,
      to,
      subject: "Recupera tu contraseña - Lotifyx",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">Recupera tu contraseña, ${name}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#8234FE,#26BEFE);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Restablecer contraseña</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;">
            Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este mensaje.
          </p>
        </div>
      `,
    });
  }

  async sendTicketConfirmation(to: string, name: string, ticketNumber: string, subject: string) {
    const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
    const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "noreply@lotifyx.com");
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Ticket #${ticketNumber} recibido - Lotifyx`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">Hemos recibido tu solicitud, ${name}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Tu ticket de soporte ha sido creado correctamente. Pronto nos pondremos en contacto contigo.
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;margin:20px 0;text-align:center">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Número de ticket</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:2px;color:#1e293b;font-family:monospace">${ticketNumber}</p>
          </div>
          <p style="color:#475569;font-size:13px;line-height:1.6"><strong>Asunto:</strong> ${subject}</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px;">
            Puedes dar seguimiento a tu ticket ingresando el número en nuestra página de soporte.
            <br><a href="${frontendUrl}/soporte" style="color:#8234FE;text-decoration:underline">Ir al centro de soporte</a>
          </p>
        </div>
      `,
    });
  }

  async sendOrderDelivered(to: string, name: string, orderId: string, operationNumber: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const reviewUrl = `${frontendUrl}/perfil/mis-compras/resena/${orderId}`;
    const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
    const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "noreply@lotifyx.com");

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: "¡Tu pedido ha sido entregado! - Lotifyx",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">¡Pedido entregado, ${name}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Tu pedido <strong>#${operationNumber?.slice(-6) || orderId.slice(0, 8)}</strong> ha sido marcado como entregado por el vendedor.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Nos encantaría conocer tu opinión. ¿Cómo fue tu experiencia con este producto?
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#8234FE,#26BEFE);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Dejar una reseña</a>
          </div>
          <p style="color:#94a3b8;font-size:12px;">
            Tu opinión ayuda a otros compradores y al vendedor a mejorar.
          </p>
        </div>
      `,
    });
  }

  async sendTicketResponse(to: string, name: string, ticketNumber: string, responseText: string) {
    const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
    const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "noreply@lotifyx.com");

    await this.transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject: `Tu ticket #${ticketNumber} ha sido respondido - Lotifyx`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
          <h2 style="color:#8234FE;margin:0 0 8px">Tu ticket ha sido respondido, ${name}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6">
            Hemos respondido a tu solicitud. Puedes ver los detalles a continuación:
          </p>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;margin:20px 0">
            <p style="margin:0;color:#94a3b8;font-size:12px;">Ticket</p>
            <p style="margin:4px 0 12px;font-size:16px;font-weight:700;color:#1e293b;font-family:monospace">${ticketNumber}</p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">Respuesta del soporte</p>
            <p style="margin:4px 0 0;color:#475569;font-size:14px;line-height:1.6">${responseText}</p>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center">
            Si tienes más dudas, puedes responder a este correo o crear un nuevo ticket en nuestro centro de soporte.
          </p>
        </div>
      `,
    });
  }
}
