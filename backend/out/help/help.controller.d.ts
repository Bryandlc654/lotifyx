import { HelpService } from "./help.service";
export declare class HelpController {
    private readonly service;
    constructor(service: HelpService);
    findAllPublished(): Promise<import("./help.entity").HelpArticle[]>;
    findAllAdmin(): Promise<import("./help.entity").HelpArticle[]>;
    findOne(id: string): Promise<import("./help.entity").HelpArticle | null>;
    create(dto: any): Promise<import("./help.entity").HelpArticle>;
    update(id: string, dto: any): Promise<{
        id: string;
        title: string;
        category: string;
        content: string;
        status: string;
        created_at: Date;
        updated_at: Date;
    } & import("./help.entity").HelpArticle>;
    remove(id: string): Promise<import("./help.entity").HelpArticle>;
}
