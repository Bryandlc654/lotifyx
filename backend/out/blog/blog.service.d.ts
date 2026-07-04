import { Repository } from "typeorm";
import { BlogPost } from "./blog.entity";
export declare class BlogService {
    private readonly repo;
    constructor(repo: Repository<BlogPost>);
    findAllPublished(): Promise<BlogPost[]>;
    findBySlug(slug: string): Promise<BlogPost | null>;
    findAllAdmin(): Promise<BlogPost[]>;
    findOne(id: string): Promise<BlogPost | null>;
    create(dto: Partial<BlogPost>): Promise<BlogPost>;
    update(id: string, dto: Partial<BlogPost>): Promise<{
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
    } & BlogPost>;
    remove(id: string): Promise<BlogPost>;
}
