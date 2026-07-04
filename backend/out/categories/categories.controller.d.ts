import { CategoriesService } from "./categories.service";
export declare class CategoriesController {
    private readonly service;
    constructor(service: CategoriesService);
    findAll(): Promise<import("./category.entity").Category[]>;
    findOne(id: string): Promise<import("./category.entity").Category>;
    create(file: Express.Multer.File, dto: any): Promise<import("./category.entity").Category>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
