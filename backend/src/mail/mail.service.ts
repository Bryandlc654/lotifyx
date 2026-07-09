import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TaskQueueService } from "../common/services/task-queue.service";

@Injectable()
export class MailService {
  constructor(
    private config: ConfigService,
    private readonly queue: TaskQueueService,
  ) {}

  private queueMail(method: string, to: string, subject: string, html: string) {
    this.queue.enqueue(`mail:${method}:${to.slice(0, 4)}`, async () => {
      console.log(`[MailService] Enviando ${method} a ${to}`);
      const provider = this.config.get<string>("MAIL_PROVIDER", "resend");
      const fromName = this.config.get<string>("SMTP_FROM_NAME", "Lotifyx");
      const fromEmail = this.config.get<string>("SMTP_FROM_EMAIL", "onboarding@resend.dev");

      if (provider === "resend") {
        const apiKey = this.config.get<string>("RESEND_API_KEY");
        if (!apiKey) throw new Error("RESEND_API_KEY no configurada");
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject, html }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Resend ${res.status}: ${errBody.slice(0, 200)}`);
        }
      } else {
        const apiKey = this.config.get<string>("BREVO_API_KEY");
        if (!apiKey) throw new Error("BREVO_API_KEY no configurada");
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": apiKey },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: to }],
            subject,
            htmlContent: html,
          }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Brevo ${res.status}: ${errBody.slice(0, 200)}`);
        }
      }
      console.log(`[MailService] ${method} enviado a ${to}`);
    });
  }

  async sendVerificationCode(to: string, code: string, name: string) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">¡Bienvenido a Lotifyx, ${name}!</h2><p style="color:#475569;font-size:14px;line-height:1.6">Gracias por registrarte. Usa el siguiente código para verificar tu cuenta:</p><div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;text-align:center;margin:20px 0"><span style="font-size:28px;font-weight:700;letter-spacing:6px;color:#1e293b">${code}</span></div><p style="color:#94a3b8;font-size:12px;">Este código expira en 15 minutos. Si no solicitaste esta cuenta, ignora este mensaje.</p></div>`;
    this.queueMail("sendVerificationCode", to, "Verifica tu cuenta - Lotifyx", html);
  }

  async sendNewsletterConfirmation(to: string, name: string | undefined) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const unsubscribeUrl = `${frontendUrl}/newsletter/cancelar`;
    const displayName = name || "suscriptor";
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">¡Suscripción confirmada!</h2><p style="color:#475569;font-size:14px;line-height:1.6">Hola <strong>${displayName}</strong>, gracias por suscribirte al newsletter de Lotifyx. Te mantendremos al tanto de las últimas novedades.</p><p style="color:#94a3b8;font-size:12px;">Si deseas cancelar la suscripción, haz clic <a href="${unsubscribeUrl}" style="color:#8234FE">aquí</a>.</p></div>`;
    this.queueMail("sendNewsletterConfirmation", to, "¡Suscripción confirmada! - Lotifyx", html);
  }

  async sendPasswordReset(to: string, token: string, name: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const resetUrl = `${frontendUrl}/restablecer?token=${token}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">Restablece tu contraseña</h2><p style="color:#475569;font-size:14px;line-height:1.6">Hola <strong>${name}</strong>, haz clic en el botón para restablecer tu contraseña:</p><a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#8234FE,#26BEFE);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Restablecer contraseña</a><p style="color:#94a3b8;font-size:12px;">Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.</p></div>`;
    this.queueMail("sendPasswordReset", to, "Restablece tu contraseña - Lotifyx", html);
  }

  async sendNewOrderNotification(to: string, orderId: string, userName: string, total: number) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">¡Nuevo pedido!</h2><p style="color:#475569;font-size:14px;line-height:1.6">Hola <strong>${userName}</strong>, has recibido un nuevo pedido.</p><div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0 0 4px"><strong>Pedido:</strong> ${orderId}</p><p style="margin:0"><strong>Total:</strong> S/ ${total.toFixed(2)}</p></div></div>`;
    this.queueMail("sendNewOrderNotification", to, "Nuevo pedido recibido - Lotifyx", html);
  }

  async sendPaymentConfirmation(to: string, operationNumber: string, amount: number, userName: string) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">¡Pago registrado!</h2><p style="color:#475569;font-size:14px;line-height:1.6">Hola <strong>${userName}</strong>, hemos registrado tu pago.</p><div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0 0 4px"><strong>Operación:</strong> ${operationNumber}</p><p style="margin:0"><strong>Monto:</strong> S/ ${amount.toFixed(2)}</p></div><p style="color:#94a3b8;font-size:12px;">Tu pago será verificado por el vendedor.</p></div>`;
    this.queueMail("sendPaymentConfirmation", to, "Pago registrado - Lotifyx", html);
  }

  async sendTicketConfirmation(to: string, name: string, ticketNumber: string, subject: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">Hemos recibido tu solicitud, ${name}</h2><p style="color:#475569;font-size:14px;line-height:1.6">Tu ticket de soporte ha sido creado. Pronto te contactaremos.</p><div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;margin:20px 0;text-align:center"><p style="margin:0;color:#94a3b8;font-size:12px;">Ticket</p><p style="margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:2px;color:#1e293b;font-family:monospace">${ticketNumber}</p></div><p style="color:#475569;font-size:13px;line-height:1.6"><strong>Asunto:</strong> ${subject}</p></div>`;
    this.queueMail("sendTicketConfirmation", to, `Ticket #${ticketNumber} recibido - Lotifyx`, html);
  }

  async sendOrderDelivered(to: string, name: string, orderId: string, operationNumber: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const reviewUrl = `${frontendUrl}/perfil/mis-compras/resena/${orderId}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">¡Pedido entregado, ${name}!</h2><p style="color:#475569;font-size:14px;line-height:1.6">Tu pedido <strong>#${operationNumber?.slice(-6) || orderId.slice(0, 8)}</strong> ha sido entregado.</p><div style="text-align:center;margin:24px 0"><a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#8234FE,#26BEFE);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Dejar una reseña</a></div></div>`;
    this.queueMail("sendOrderDelivered", to, "¡Tu pedido ha sido entregado! - Lotifyx", html);
  }

  async sendTicketResponse(to: string, name: string, ticketNumber: string, responseText: string) {
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px"><h2 style="color:#8234FE;margin:0 0 8px">Tu ticket ha sido respondido, ${name}</h2><div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px 24px;margin:20px 0"><p style="margin:0;color:#94a3b8;font-size:12px;">Ticket <strong>${ticketNumber}</strong></p><p style="margin:4px 0 0;color:#475569;font-size:14px;line-height:1.6">${responseText}</p></div></div>`;
    this.queueMail("sendTicketResponse", to, `Tu ticket #${ticketNumber} ha sido respondido - Lotifyx`, html);
  }

  async sendAuctionWon(to: string, name: string, productTitle: string, bidAmount: number, remainingAmount: number, orderId: string) {
    const frontendUrl = this.config.get<string>("FRONTEND_URL", "http://localhost:3000");
    const orderUrl = `${frontendUrl}/perfil/pedido/${orderId}`;
    const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#f8fafc;border-radius:12px">
<h2 style="color:#8234FE;margin:0 0 8px">¡Felicidades, ganaste la subasta!</h2>
<p style="color:#475569;font-size:14px;line-height:1.6">Hola <strong>${name}</strong>, has ganado la subasta de <strong>${productTitle}</strong>.</p>
<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
<p style="margin:0 0 4px"><strong>Monto de tu puja:</strong> S/ ${Number(bidAmount).toFixed(2)}</p>
<p style="margin:0"><strong>Saldo pendiente:</strong> S/ ${Number(remainingAmount).toFixed(2)}</p>
</div>
<p style="color:#475569;font-size:14px;line-height:1.6">Para completar la compra, paga el saldo pendiente lo antes posible.</p>
<div style="text-align:center;margin:24px 0"><a href="${orderUrl}" style="display:inline-block;background:linear-gradient(135deg,#8234FE,#26BEFE);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Pagar saldo pendiente</a></div>
</div>`;
    this.queueMail("sendAuctionWon", to, "¡Ganaste la subasta! - Lotifyx", html);
  }
}
