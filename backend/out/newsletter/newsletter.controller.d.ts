import { Response } from "express";
import { NewsletterService } from "./newsletter.service";
export declare class NewsletterController {
    private readonly service;
    constructor(service: NewsletterService);
    subscribe(body: {
        name?: string;
        email: string;
    }): Promise<import("./newsletter.entity").NewsletterSubscriber>;
    unsubscribe(body: {
        email: string;
    }): Promise<import("./newsletter.entity").NewsletterSubscriber>;
    findAll(): Promise<import("./newsletter.entity").NewsletterSubscriber[]>;
    remove(id: string): Promise<import("./newsletter.entity").NewsletterSubscriber>;
    exportCsv(res: Response): Promise<void>;
}
