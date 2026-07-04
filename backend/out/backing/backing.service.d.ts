import { Repository } from "typeorm";
import { BackingLogo } from "./backing-logo.entity";
export declare class BackingService {
    private readonly repo;
    constructor(repo: Repository<BackingLogo>);
    findAll(): Promise<BackingLogo[]>;
    create(name: string, file: Express.Multer.File): Promise<BackingLogo>;
    update(id: string, dto: {
        name?: string;
        is_active?: boolean;
    }, file?: Express.Multer.File): Promise<BackingLogo>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
