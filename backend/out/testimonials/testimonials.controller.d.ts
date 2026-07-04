import { TestimonialsService } from "./testimonials.service";
export declare class TestimonialsController {
    private readonly service;
    constructor(service: TestimonialsService);
    findAll(): Promise<import("./testimonial.entity").Testimonial[]>;
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
    } & import("./testimonial.entity").Testimonial>;
    reorder(ids: string[]): Promise<{
        message: string;
    }>;
    update(id: string, dto: any): Promise<{
        stars: number;
        text: string;
        name: string;
        cargo: string;
        is_active: boolean;
        id: string;
        order_index: number;
        created_at: Date;
        updated_at: Date;
    } & import("./testimonial.entity").Testimonial>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
