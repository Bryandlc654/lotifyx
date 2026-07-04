import { Repository } from "typeorm";
import { CategoryField } from "./category-field.entity";
export declare class CategoryFieldsService {
    private readonly repo;
    constructor(repo: Repository<CategoryField>);
    findByCategory(categoryId: string): Promise<CategoryField[]>;
    findAll(): Promise<CategoryField[]>;
    findOne(id: string): Promise<CategoryField>;
    create(dto: {
        category_id: string;
        name: string;
        label: string;
        type: string;
        required?: boolean;
        options?: string[];
    }): Promise<CategoryField>;
    update(id: string, dto: Partial<{
        name: string;
        label: string;
        type: string;
        required: boolean;
        options: string[];
        order_index: number;
    }>): Promise<{
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
    } & CategoryField>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
