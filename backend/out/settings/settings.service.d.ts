import { Repository } from "typeorm";
import { Setting } from "./setting.entity";
export declare class SettingsService {
    private readonly repo;
    constructor(repo: Repository<Setting>);
    getAll(): Promise<Record<string, string>>;
    getMany(keys: string[]): Promise<Record<string, string>>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<{
        key: string;
        value: string;
    } & Setting>;
    setMany(data: Record<string, string>): Promise<{
        message: string;
    }>;
}
