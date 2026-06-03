import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Marquee } from "./marquee.entity";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class MarqueesService {
  constructor(
    @InjectRepository(Marquee)
    private readonly repo: Repository<Marquee>
  ) {}

  findAll() {
    return this.repo.find({ order: { order_index: "ASC" } });
  }

  create(name: string, file: Express.Multer.File) {
    const m = this.repo.create({ name, image_url: `/uploads/${file.filename}` });
    return this.repo.save(m);
  }

  async update(id: string, name?: string, file?: Express.Multer.File) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException("Logo no encontrado");

    if (name !== undefined) m.name = name;

    if (file) {
      const oldPath = path.join(__dirname, "..", "..", "uploads", m.image_url.replace("/uploads/", ""));
      try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch {}
      m.image_url = `/uploads/${file.filename}`;
    }

    return this.repo.save(m);
  }

  async remove(id: string) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException("Logo no encontrado");

    const fp = path.join(__dirname, "..", "..", "uploads", m.image_url.replace("/uploads/", ""));
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch {}

    await this.repo.remove(m);
    return { message: "Logo eliminado" };
  }
}
