import { SecondaryBannersService } from "./secondary-banners.service";
export declare class SecondaryBannersController {
    private readonly service;
    constructor(service: SecondaryBannersService);
    findAll(type?: string): Promise<import("./secondary-banner.entity").SecondaryBanner[]>;
    create(file: Express.Multer.File, dto: any): Promise<import("./secondary-banner.entity").SecondaryBanner>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<import("./secondary-banner.entity").SecondaryBanner>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
