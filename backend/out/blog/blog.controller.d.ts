import { BlogService } from "./blog.service";
export declare class BlogController {
    private readonly service;
    constructor(service: BlogService);
    findAllPublished(): Promise<import("./blog.entity").BlogPost[]>;
    findBySlug(slug: string): Promise<import("./blog.entity").BlogPost | null>;
    findAllAdmin(): Promise<import("./blog.entity").BlogPost[]>;
    findOne(id: string): Promise<import("./blog.entity").BlogPost | null>;
    create(dto: any): Promise<import("./blog.entity").BlogPost>;
    update(id: string, dto: any): Promise<{
        id: string;
        title: string;
        slug: string;
        content: string;
        excerpt: string;
        image_url: string;
        author: string;
        status: string;
        published_at: Date;
        created_at: Date;
        updated_at: Date;
    } & import("./blog.entity").BlogPost>;
    remove(id: string): Promise<import("./blog.entity").BlogPost>;
}
