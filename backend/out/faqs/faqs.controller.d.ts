import { FaqsService } from "./faqs.service";
export declare class FaqsController {
    private readonly service;
    constructor(service: FaqsService);
    findAll(category?: string): Promise<import("./faq.entity").Faq[]>;
    findAllAdmin(): Promise<import("./faq.entity").Faq[]>;
    create(dto: any): Promise<import("./faq.entity").Faq>;
    update(id: string, dto: any): Promise<{
        category: string;
        question: string;
        answer: string;
        is_active: boolean;
        order_index: number;
        id: string;
        created_at: Date;
        updated_at: Date;
    } & import("./faq.entity").Faq>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
