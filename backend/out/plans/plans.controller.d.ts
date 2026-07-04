import { PlansService } from "./plans.service";
export declare class PlansController {
    private readonly service;
    constructor(service: PlansService);
    findAll(): Promise<import("./plan.entity").Plan[]>;
    findOne(id: string): Promise<import("./plan.entity").Plan | null>;
    create(dto: any): Promise<import("./plan.entity").Plan>;
    update(id: string, dto: any): Promise<{
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
    } & import("./plan.entity").Plan>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
