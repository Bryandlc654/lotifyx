import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PressArticle } from "./press.entity";

@Injectable()
export class PressService {
  constructor(
    @InjectRepository(PressArticle) private readonly repo: Repository<PressArticle>,
  ) {}

  findAllPublished() {
    return this.repo.find({ where: { status: "published" }, order: { published_at: "DESC" }, take: 50 });
  }

  findAllAdmin() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  async create(dto: Partial<PressArticle>) {
    const article = new PressArticle();
    Object.assign(article, dto);
    if (dto.status === "published") article.published_at = new Date();
    return this.repo.save(article);
  }

  async update(id: string, dto: Partial<PressArticle>) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException("Artículo no encontrado");
    if (dto.status === "published" && !a.published_at) dto.published_at = new Date();
    return this.repo.save({ ...a, ...dto });
  }

  async remove(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException("Artículo no encontrado");
    return this.repo.remove(a);
  }
}
