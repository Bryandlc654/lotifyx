import { DataSource } from "typeorm";
export declare class AuditService {
    private readonly ds;
    constructor(ds: DataSource);
    log(data: {
        userId?: string;
        userName?: string;
        action: string;
        entity: string;
        entityId?: string;
        details?: any;
    }): Promise<void>;
    findAll(filters?: {
        action?: string;
        entity?: string;
        limit?: number;
    }): Promise<any>;
}
