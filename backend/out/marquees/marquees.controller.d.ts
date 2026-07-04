import { MarqueesService } from "./marquees.service";
export declare class MarqueesController {
    private readonly service;
    constructor(service: MarqueesService);
    findAll(): Promise<import("./marquee.entity").Marquee[]>;
    create(file: Express.Multer.File, name: string): Promise<import("./marquee.entity").Marquee>;
    update(id: string, name: string, file?: Express.Multer.File): Promise<import("./marquee.entity").Marquee>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
