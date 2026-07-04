import { Repository } from "typeorm";
import { SupportTicket } from "./ticket.entity";
import { MailService } from "../mail/mail.service";
export declare class SupportService {
    private readonly repo;
    private readonly mail;
    constructor(repo: Repository<SupportTicket>, mail: MailService);
    private sanitize;
    create(dto: Partial<SupportTicket>): Promise<SupportTicket>;
    findByTicketNumber(number: string): Promise<SupportTicket | null>;
    findAllAdmin(): Promise<SupportTicket[]>;
    update(id: string, dto: Partial<SupportTicket>): Promise<{
        id: string;
        ticket_number: string;
        name: string;
        email: string;
        subject: string;
        description: string;
        images: string[];
        files: string[];
        status: string;
        response: string;
        created_at: Date;
        updated_at: Date;
    } & SupportTicket>;
    remove(id: string): Promise<SupportTicket>;
}
