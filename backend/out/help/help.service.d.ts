import { Repository } from "typeorm";
import { HelpArticle } from "./help.entity";
export declare class HelpService {
    private readonly repo;
    constructor(repo: Repository<HelpArticle>);
    findAllPublished(): Promise<HelpArticle[]>;
    findAllAdmin(): Promise<HelpArticle[]>;
    findOne(id: string): Promise<HelpArticle | null>;
    create(dto: Partial<HelpArticle>): Promise<HelpArticle>;
    update(id: string, dto: Partial<HelpArticle>): Promise<{
        id: string;
        title: string;
        category: string;
        content: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & HelpArticle>;
    remove(id: string): Promise<HelpArticle>;
}
