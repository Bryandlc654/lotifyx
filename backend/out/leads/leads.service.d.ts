import { Repository } from "typeorm";
import { Lead } from "./lead.entity";
export declare class LeadsService {
    private readonly repo;
    constructor(repo: Repository<Lead>);
    findAll(): Promise<Lead[]>;
    findOne(id: string): Promise<Lead | null>;
    create(dto: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
        message: string;
    }): Promise<Lead>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
