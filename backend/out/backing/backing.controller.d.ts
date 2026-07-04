import { BackingService } from "./backing.service";
export declare class BackingController {
    private readonly service;
    constructor(service: BackingService);
    findAll(): Promise<import("./backing-logo.entity").BackingLogo[]>;
    create(file: Express.Multer.File, name: string): Promise<import("./backing-logo.entity").BackingLogo>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<import("./backing-logo.entity").BackingLogo>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
