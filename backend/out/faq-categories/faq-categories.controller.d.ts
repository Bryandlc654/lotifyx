import { FaqCategoriesService } from "./faq-categories.service";
export declare class FaqCategoriesController {
    private readonly service;
    constructor(service: FaqCategoriesService);
    findAll(): Promise<import("./faq-category.entity").FaqCategory[]>;
    findAllAdmin(): Promise<import("./faq-category.entity").FaqCategory[]>;
    findOne(id: string): Promise<import("./faq-category.entity").FaqCategory>;
    create(dto: any): Promise<import("./faq-category.entity").FaqCategory>;
    update(id: string, dto: any): Promise<{
        name: string;
        slug: string;
        description: string;
        order_index: number;
        is_active: boolean;
        id: string;
        created_at: Date;
        updated_at: Date;
    } & import("./faq-category.entity").FaqCategory>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
