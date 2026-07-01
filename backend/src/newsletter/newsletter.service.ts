import { Injectable, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NewsletterSubscriber } from "./newsletter.entity";
import { MailService } from "../mail/mail.service";

@Injectable()
export class NewsletterService {
  constructor(
    @InjectRepository(NewsletterSubscriber) private readonly repo: Repository<NewsletterSubscriber>,
    private readonly mail: MailService,
  ) {}

  async subscribe(name: string | undefined, email: string) {
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) {
      if (!existing.is_active) {
        existing.is_active = true;
        const saved = await this.repo.save(existing);
        this.mail.sendNewsletterConfirmation(email, name).catch(e => console.error("[Mail] Newsletter confirm error:", e.message));
        return saved;
      }
      throw new ConflictException("Este correo ya está suscrito al newsletter");
    }
    const saved = await this.repo.save(this.repo.create({ name, email }));
    this.mail.sendNewsletterConfirmation(email, name).catch(e => console.error("[Mail] Newsletter confirm error:", e.message));
    return saved;
  }

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  async remove(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new Error("Suscriptor no encontrado");
    return this.repo.remove(sub);
  }

  async unsubscribe(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new Error("Suscriptor no encontrado");
    sub.is_active = false;
    return this.repo.save(sub);
  }

  async unsubscribeByEmail(email: string) {
    const sub = await this.repo.findOne({ where: { email } });
    if (!sub) throw new Error("No encontramos una suscripción activa con ese correo");
    if (!sub.is_active) throw new Error("Este correo ya estaba dado de baja");
    sub.is_active = false;
    return this.repo.save(sub);
  }
}
