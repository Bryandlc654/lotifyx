import { Repository } from "typeorm";
import { Category } from "./category.entity";
export declare class CategoriesService {
    private readonly repo;
    constructor(repo: Repository<Category>);
    findAll(): Promise<Category[]>;
    findOne(id: string): Promise<Category>;
    create(dto: any, file?: Express.Multer.File): Promise<Category>;
    update(id: string, dto: any, file?: Express.Multer.File): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
