import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicket } from "./ticket.entity";
import { MailService } from "../mail/mail.service";
import { randomBytes } from "crypto";

function generateTicketNumber(): string {
  const date = new Date();
  const d = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const r = randomBytes(3).toString("hex").toUpperCase();
  return `TKT-${d}-${r}`;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket) private readonly repo: Repository<SupportTicket>,
    private readonly mail: MailService,
  ) {}

  private sanitize(str: string): string {
    return str.replace(/<[^>]*>/g, "").trim();
  }

  async create(dto: Partial<SupportTicket>) {
    let ticket_number = generateTicketNumber();
    while (await this.repo.findOne({ where: { ticket_number } })) {
      ticket_number = generateTicketNumber();
    }
    const sanitized = {
      name: this.sanitize(dto.name || ""),
      email: this.sanitize(dto.email || ""),
      subject: this.sanitize(dto.subject || ""),
      description: this.sanitize(dto.description || ""),
      images: dto.images || [],
      files: dto.files || [],
    };
    const saved = await this.repo.save(this.repo.create({ ...sanitized, ticket_number }));
    this.mail.sendTicketConfirmation(sanitized.email, sanitized.name, ticket_number, sanitized.subject)
      .catch(e => console.error("[Mail] Ticket confirm error:", e.message));
    return saved;
  }

  findByTicketNumber(number: string) {
    return this.repo.findOne({ where: { ticket_number: number } });
  }

  findAllAdmin() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  async update(id: string, dto: Partial<SupportTicket>) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Ticket no encontrado");
    const saved = await this.repo.save({ ...t, ...dto });
    if (dto.response && dto.status === "resolved") {
      this.mail.sendTicketResponse(t.email, t.name, t.ticket_number, dto.response)
        .catch(e => console.error("[Mail] Ticket response error:", e.message));
    }
    return saved;
  }

  async remove(id: string) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Ticket no encontrado");
    return this.repo.remove(t);
  }
}
