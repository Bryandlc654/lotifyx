import { Repository } from "typeorm";
import { Marquee } from "./marquee.entity";
export declare class MarqueesService {
    private readonly repo;
    constructor(repo: Repository<Marquee>);
    findAll(): Promise<Marquee[]>;
    create(name: string, file: Express.Multer.File): Promise<Marquee>;
    update(id: string, name?: string, file?: Express.Multer.File): Promise<Marquee>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
