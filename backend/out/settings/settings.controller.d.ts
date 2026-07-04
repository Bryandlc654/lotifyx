import { SettingsService } from "./settings.service";
export declare class SettingsController {
    private readonly service;
    constructor(service: SettingsService);
    getAll(): Promise<Record<string, string>>;
    getTopbar(): Promise<Record<string, string>>;
    update(data: Record<string, string>): Promise<{
        message: string;
    }>;
}
