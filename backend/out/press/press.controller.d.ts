import { PressService } from "./press.service";
export declare class PressController {
    private readonly service;
    constructor(service: PressService);
    findAllPublished(): Promise<import("./press.entity").PressArticle[]>;
    findAllAdmin(): Promise<import("./press.entity").PressArticle[]>;
    create(dto: any): Promise<import("./press.entity").PressArticle>;
    update(id: string, dto: any): Promise<{
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
    } & import("./press.entity").PressArticle>;
    remove(id: string): Promise<import("./press.entity").PressArticle>;
}
