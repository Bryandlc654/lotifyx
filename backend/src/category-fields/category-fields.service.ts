import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CategoryField } from "./category-field.entity";

@Injectable()
export class CategoryFieldsService {
  constructor(@InjectRepository(CategoryField) private readonly repo: Repository<CategoryField>) {}

  findByCategory(categoryId: string) {
    return this.repo.find({ where: { category_id: categoryId }, order: { order_index: "ASC" } });
  }

  findAll() {
    return this.repo.find({ order: { category_id: "ASC", order_index: "ASC" } });
  }

  async findOne(id: string) {
    const field = await this.repo.findOne({ where: { id } });
    if (!field) throw new NotFoundException("Campo no encontrado");
    return field;
  }

  create(dto: { category_id: string; name: string; label: string; type: string; required?: boolean; options?: string[] }) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<{ name: string; label: string; type: string; required: boolean; options: string[]; order_index: number }>) {
    const field = await this.findOne(id);
    return this.repo.save({ ...field, ...dto });
  }

  async remove(id: string) {
    const field = await this.findOne(id);
    await this.repo.remove(field);
    return { message: "Campo eliminado" };
  }
}
