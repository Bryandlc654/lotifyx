import { OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SettingsService } from "../settings/settings.service";
export declare class MailService implements OnModuleInit {
    private config;
    private settings;
    private transporter;
    constructor(config: ConfigService, settings: SettingsService);
    onModuleInit(): Promise<void>;
    reloadTransporter(): Promise<void>;
    sendVerificationCode(to: string, code: string, name: string): Promise<void>;
    sendNewsletterConfirmation(to: string, name: string | undefined): Promise<void>;
    sendPasswordReset(to: string, token: string, name: string): Promise<void>;
    sendTicketConfirmation(to: string, name: string, ticketNumber: string, subject: string): Promise<void>;
    sendOrderDelivered(to: string, name: string, orderId: string, operationNumber: string): Promise<void>;
    sendTicketResponse(to: string, name: string, ticketNumber: string, responseText: string): Promise<void>;
}
