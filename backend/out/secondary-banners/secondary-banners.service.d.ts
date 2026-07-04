import { Repository } from "typeorm";
import { SecondaryBanner } from "./secondary-banner.entity";
export declare class SecondaryBannersService {
    private readonly repo;
    constructor(repo: Repository<SecondaryBanner>);
    findAll(): Promise<SecondaryBanner[]>;
    findByType(type: string): Promise<SecondaryBanner[]>;
    create(dto: {
        title: string;
        subtitle?: string;
        type: string;
        link_url?: string;
        button_text?: string;
    }, file: Express.Multer.File): Promise<SecondaryBanner>;
    update(id: string, dto: {
        title?: string;
        subtitle?: string;
        link_url?: string;
        button_text?: string;
        is_active?: boolean;
        type?: string;
    }, file?: Express.Multer.File): Promise<SecondaryBanner>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
