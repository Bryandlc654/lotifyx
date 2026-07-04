import { Repository } from "typeorm";
import { Banner } from "./banner.entity";
export declare class BannersService {
    private readonly bannerRepository;
    constructor(bannerRepository: Repository<Banner>);
    findAll(): Promise<Banner[]>;
    create(title: string, file: Express.Multer.File): Promise<Banner>;
    remove(id: string): Promise<{
        message: string;
    }>;
    update(id: string, title?: string, file?: Express.Multer.File): Promise<Banner>;
}
