import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SecondaryBanner } from "./secondary-banner.entity";
import * as fs from "fs";
import * as path from "path";

function isUUID(val: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val); }

@Injectable()
export class SecondaryBannersService {
  constructor(@InjectRepository(SecondaryBanner) private readonly repo: Repository<SecondaryBanner>) {}

  findAll() { return this.repo.find({ order: { type: "ASC", order_index: "ASC" } }); }

  async findByType(type: string) { return this.repo.find({ where: { type, is_active: true }, order: { order_index: "ASC" } }); }

  async create(dto: { title: string; subtitle?: string; type: string; link_url?: string; button_text?: string }, file: Express.Multer.File) {
    return this.repo.save(this.repo.create({
      title: dto.title, subtitle: dto.subtitle, type: dto.type,
      image_url: `/uploads/${file.filename}`,
      link_url: dto.link_url, button_text: dto.button_text,
    }));
  }

  async update(id: string, dto: { title?: string; subtitle?: string; link_url?: string; button_text?: string; is_active?: boolean; type?: string }, file?: Express.Multer.File) {
    if (!isUUID(id)) throw new NotFoundException("Banner no encontrado");
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException("Banner no encontrado");

    if (dto.title !== undefined) b.title = dto.title;
    if (dto.subtitle !== undefined) b.subtitle = dto.subtitle;
    if (dto.link_url !== undefined) b.link_url = dto.link_url;
    if (dto.button_text !== undefined) b.button_text = dto.button_text;
    if (dto.is_active !== undefined) b.is_active = dto.is_active;
    if (dto.type !== undefined) b.type = dto.type;

    if (file) {
      const oldPath = path.join(__dirname, "..", "..", "uploads", b.image_url.replace("/uploads/", ""));
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch {}
      b.image_url = `/uploads/${file.filename}`;
    }

    return this.repo.save(b);
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Banner no encontrado");
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException("Banner no encontrado");

    const fp = path.join(__dirname, "..", "..", "uploads", b.image_url.replace("/uploads/", ""));
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}
    await this.repo.remove(b);
    return { message: "Banner eliminado" };
  }
}
