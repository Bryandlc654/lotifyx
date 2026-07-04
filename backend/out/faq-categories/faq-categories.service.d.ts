import { Repository } from "typeorm";
import { FaqCategory } from "./faq-category.entity";
export declare class FaqCategoriesService {
    private readonly repo;
    constructor(repo: Repository<FaqCategory>);
    findAll(): Promise<FaqCategory[]>;
    findActive(): Promise<FaqCategory[]>;
    findOne(id: string): Promise<FaqCategory>;
    create(dto: {
        name: string;
        slug?: string;
        description?: string;
    }): Promise<FaqCategory>;
    update(id: string, dto: Partial<{
        name: string;
        slug: string;
        description: string;
        order_index: number;
        is_active: boolean;
    }>): Promise<{
        name: string;
        slug: string;
        description: string;
        order_index: number;
        is_active: boolean;
        id: string;
        created_at: Date;
        updated_at: Date;
    } & FaqCategory>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
