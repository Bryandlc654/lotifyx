import { DataSource } from "typeorm";
export declare class AdminDashboardController {
    private readonly ds;
    constructor(ds: DataSource);
    getStats(): Promise<any>;
}
