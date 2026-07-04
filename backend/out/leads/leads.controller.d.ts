import { LeadsService } from "./leads.service";
import { CreateLeadDto } from "./create-lead.dto";
import { DataSource } from "typeorm";
export declare class LeadsController {
    private readonly service;
    private readonly dataSource;
    constructor(service: LeadsService, dataSource: DataSource);
    dbInfo(): Promise<{
        encoding: any;
        collation: any;
    }>;
    findAll(): Promise<import("./lead.entity").Lead[]>;
    findOne(id: string): Promise<import("./lead.entity").Lead | null>;
    create(dto: CreateLeadDto): Promise<import("./lead.entity").Lead>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
