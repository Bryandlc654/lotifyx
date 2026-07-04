import { Repository } from "typeorm";
import { NewsletterSubscriber } from "./newsletter.entity";
import { MailService } from "../mail/mail.service";
export declare class NewsletterService {
    private readonly repo;
    private readonly mail;
    constructor(repo: Repository<NewsletterSubscriber>, mail: MailService);
    subscribe(name: string | undefined, email: string): Promise<NewsletterSubscriber>;
    findAll(): Promise<NewsletterSubscriber[]>;
    remove(id: string): Promise<NewsletterSubscriber>;
    unsubscribe(id: string): Promise<NewsletterSubscriber>;
    unsubscribeByEmail(email: string): Promise<NewsletterSubscriber>;
}
