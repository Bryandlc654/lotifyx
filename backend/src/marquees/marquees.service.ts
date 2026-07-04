import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Marquee } from "./marquee.entity";

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
    const m = this.repo.create({ name, image_url: file.filename });
    return this.repo.save(m);
  }

  async update(id: string, name?: string, file?: Express.Multer.File) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException("Logo no encontrado");
    if (name !== undefined) m.name = name;
    if (file) m.image_url = file.filename;
    return this.repo.save(m);
  }

  async remove(id: string) {
    const m = await this.repo.findOne({ where: { id } });
    if (!m) throw new NotFoundException("Logo no encontrado");
    await this.repo.remove(m);
    return { message: "Logo eliminado" };
  }
}
