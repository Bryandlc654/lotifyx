import { CategoryFieldsService } from "./category-fields.service";
export declare class CategoryFieldsController {
    private readonly service;
    constructor(service: CategoryFieldsService);
    findByCategory(categoryId?: string): Promise<import("./category-field.entity").CategoryField[]>;
    findAllAdmin(): Promise<import("./category-field.entity").CategoryField[]>;
    findOne(id: string): Promise<import("./category-field.entity").CategoryField>;
    create(dto: any): Promise<import("./category-field.entity").CategoryField>;
    update(id: string, dto: any): Promise<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options: string[];
        order_index: number;
        id: string;
        category_id: string;
        created_at: Date;
        updated_at: Date;
    } & import("./category-field.entity").CategoryField>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
