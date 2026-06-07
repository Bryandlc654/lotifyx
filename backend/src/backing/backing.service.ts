import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BackingLogo } from "./backing-logo.entity";
import * as fs from "fs";
import * as path from "path";

function isUUID(v: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v); }

@Injectable()
export class BackingService {
  constructor(@InjectRepository(BackingLogo) private readonly repo: Repository<BackingLogo>) {}

  findAll() { return this.repo.find({ order: { order_index: "ASC" } }); }

  create(name: string, file: Express.Multer.File) {
    return this.repo.save(this.repo.create({ name, image_url: `/uploads/${file.filename}` }));
  }

  async update(id: string, dto: { name?: string; is_active?: boolean }, file?: Express.Multer.File) {
    if (!isUUID(id)) throw new NotFoundException("Logo no encontrado");
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Logo no encontrado");

    if (dto.name !== undefined) item.name = dto.name;
    if (dto.is_active !== undefined) item.is_active = dto.is_active;

    if (file) {
      const old = path.join(__dirname, "..", "..", "uploads", item.image_url.replace("/uploads/", ""));
      try { if (fs.existsSync(old)) fs.unlinkSync(old); } catch {}
      item.image_url = `/uploads/${file.filename}`;
    }

    return this.repo.save(item);
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Logo no encontrado");
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Logo no encontrado");

    const fp = path.join(__dirname, "..", "..", "uploads", item.image_url.replace("/uploads/", ""));
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    await this.repo.remove(item);
    return { message: "Logo eliminado" };
  }
}
