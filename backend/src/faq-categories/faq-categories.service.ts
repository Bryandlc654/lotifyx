import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FaqCategory } from "./faq-category.entity";

@Injectable()
export class FaqCategoriesService {
  constructor(@InjectRepository(FaqCategory) private readonly repo: Repository<FaqCategory>) {}

  findAll() { return this.repo.find({ order: { order_index: "ASC", name: "ASC" } }); }

  findActive() { return this.repo.find({ where: { is_active: true }, order: { order_index: "ASC", name: "ASC" } }); }

  async findOne(id: string) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException("Categoría no encontrada");
    return cat;
  }

  create(dto: { name: string; slug?: string; description?: string }) {
    const slug = dto.slug || dto.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return this.repo.save(this.repo.create({ ...dto, slug }));
  }

  async update(id: string, dto: Partial<{ name: string; slug: string; description: string; order_index: number; is_active: boolean }>) {
    const cat = await this.findOne(id);
    return this.repo.save({ ...cat, ...dto });
  }

  async remove(id: string) {
    const cat = await this.findOne(id);
    await this.repo.remove(cat);
    return { message: "Categoría eliminada" };
  }
}
