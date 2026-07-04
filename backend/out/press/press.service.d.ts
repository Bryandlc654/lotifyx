import { Repository } from "typeorm";
import { PressArticle } from "./press.entity";
export declare class PressService {
    private readonly repo;
    constructor(repo: Repository<PressArticle>);
    findAllPublished(): Promise<PressArticle[]>;
    findAllAdmin(): Promise<PressArticle[]>;
    create(dto: Partial<PressArticle>): Promise<PressArticle>;
    update(id: string, dto: Partial<PressArticle>): Promise<{
        id: string;
        title: string;
        excerpt: string;
        source: string;
        link: string;
        image_url: string;
        status: string;
        published_at: Date;
        created_at: Date;
        updated_at: Date;
    } & PressArticle>;
    remove(id: string): Promise<PressArticle>;
}
