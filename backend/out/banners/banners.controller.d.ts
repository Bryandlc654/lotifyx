import { BannersService } from "./banners.service";
export declare class BannersController {
    private readonly bannersService;
    constructor(bannersService: BannersService);
    findAll(): Promise<import("./banner.entity").Banner[]>;
    create(file: Express.Multer.File, title: string): Promise<import("./banner.entity").Banner>;
    update(id: string, title: string, file?: Express.Multer.File): Promise<import("./banner.entity").Banner>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
