import { Repository } from "typeorm";
import { Plan } from "./plan.entity";
export declare class PlansService {
    private readonly repo;
    constructor(repo: Repository<Plan>);
    findAll(): Promise<Plan[]>;
    findOne(id: string): Promise<Plan | null>;
    create(dto: {
        name: string;
        description?: string;
        price: number;
        max_products: number;
        max_featured?: number;
        duration_days?: number;
        icon?: string;
    }): Promise<Plan>;
    update(id: string, dto: Partial<{
        name: string;
        description: string;
        price: number;
        max_products: number;
        max_featured: number;
        duration_days: number;
        icon: string;
        is_active: boolean;
        order_index: number;
    }>): Promise<{
        name: string;
        description: string;
        price: number;
        max_products: number;
        max_featured: number;
        duration_days: number;
        icon: string;
        is_active: boolean;
        order_index: number;
        id: string;
        commission: number;
        created_at: Date;
    } & Plan>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
