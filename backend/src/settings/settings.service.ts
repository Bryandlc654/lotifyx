import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Setting } from "./setting.entity";

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private readonly repo: Repository<Setting>) {}

  async getAll() {
    const rows = await this.repo.find();
    const result: Record<string, string> = {};
    for (const r of rows) result[r.key] = r.value;
    return result;
  }

  async get(key: string): Promise<string | null> {
    const r = await this.repo.findOne({ where: { key } });
    return r?.value ?? null;
  }

  async set(key: string, value: string) {
    return this.repo.save({ key, value });
  }

  async setMany(data: Record<string, string>) {
    const promises = Object.entries(data).map(([key, value]) =>
      this.repo.save({ key, value })
    );
    await Promise.all(promises);
    return { message: "Configuración actualizada" };
  }
}
