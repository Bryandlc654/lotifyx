import { Repository } from "typeorm";
import { Testimonial } from "./testimonial.entity";
export declare class TestimonialsService {
    private readonly repo;
    constructor(repo: Repository<Testimonial>);
    findAll(): Promise<Testimonial[]>;
    create(dto: {
        stars: number;
        text: string;
        name: string;
        cargo: string;
    }): Promise<{
        stars: number;
        text: string;
        name: string;
        cargo: string;
    } & Testimonial>;
    update(id: string, dto: Partial<{
        stars: number;
        text: string;
        name: string;
        cargo: string;
        is_active: boolean;
    }>): Promise<{
        stars: number;
        text: string;
        name: string;
        cargo: string;
        is_active: boolean;
        id: string;
        order_index: number;
        created_at: Date;
        updated_at: Date;
    } & Testimonial>;
    remove(id: string): Promise<{
        message: string;
    }>;
    reorder(ids: string[]): Promise<{
        message: string;
    }>;
}
