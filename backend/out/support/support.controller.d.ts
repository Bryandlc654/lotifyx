import { SupportService } from "./support.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
export declare class SupportController {
    private readonly service;
    constructor(service: SupportService);
    create(body: CreateTicketDto): Promise<import("./ticket.entity").SupportTicket>;
    findByNumber(ticketNumber: string): Promise<import("./ticket.entity").SupportTicket | null>;
    findAllAdmin(): Promise<import("./ticket.entity").SupportTicket[]>;
    update(id: string, body: any): Promise<{
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
    } & import("./ticket.entity").SupportTicket>;
    remove(id: string): Promise<import("./ticket.entity").SupportTicket>;
}
