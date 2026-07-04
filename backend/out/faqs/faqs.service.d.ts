import { Repository } from "typeorm";
import { Faq } from "./faq.entity";
export declare class FaqsService {
    private readonly repo;
    constructor(repo: Repository<Faq>);
    findAll(category?: string): Promise<Faq[]>;
    findAllAdmin(): Promise<Faq[]>;
    create(dto: {
        category: string;
        question: string;
        answer: string;
    }): Promise<Faq>;
    update(id: string, dto: Partial<{
        category: string;
        question: string;
        answer: string;
        is_active: boolean;
        order_index: number;
    }>): Promise<{
        category: string;
        question: string;
        answer: string;
        is_active: boolean;
        order_index: number;
        id: string;
        created_at: Date;
        updated_at: Date;
    } & Faq>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
