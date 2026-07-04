import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BackingLogo } from "./backing-logo.entity";

function isUUID(v: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v); }

@Injectable()
export class BackingService {
  constructor(@InjectRepository(BackingLogo) private readonly repo: Repository<BackingLogo>) {}

  findAll() { return this.repo.find({ order: { order_index: "ASC" } }); }

  create(name: string, file: Express.Multer.File) {
    return this.repo.save(this.repo.create({ name, image_url: file.filename }));
  }

  async update(id: string, dto: { name?: string; is_active?: boolean }, file?: Express.Multer.File) {
    if (!isUUID(id)) throw new NotFoundException("Logo no encontrado");
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Logo no encontrado");
    if (dto.name !== undefined) item.name = dto.name;
    if (dto.is_active !== undefined) item.is_active = dto.is_active;
    if (file) item.image_url = file.filename;
    return this.repo.save(item);
  }

  async remove(id: string) {
    if (!isUUID(id)) throw new NotFoundException("Logo no encontrado");
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Logo no encontrado");
    await this.repo.remove(item);
    return { message: "Logo eliminado" };
  }
}
