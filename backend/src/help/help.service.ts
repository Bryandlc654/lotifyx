import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { HelpArticle } from "./help.entity";

@Injectable()
export class HelpService {
  constructor(
    @InjectRepository(HelpArticle) private readonly repo: Repository<HelpArticle>,
  ) {}

  findAllPublished() {
    return this.repo.find({ where: { status: "published" }, order: { category: "ASC", title: "ASC" }, take: 200 });
  }

  findAllAdmin() {
    return this.repo.find({ order: { category: "ASC", title: "ASC" }, take: 200 });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: Partial<HelpArticle>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<HelpArticle>) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException("Artículo no encontrado");
    return this.repo.save({ ...a, ...dto });
  }

  async remove(id: string) {
    const a = await this.repo.findOne({ where: { id } });
    if (!a) throw new NotFoundException("Artículo no encontrado");
    return this.repo.remove(a);
  }
}
