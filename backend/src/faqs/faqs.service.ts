import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Faq } from "./faq.entity";

@Injectable()
export class FaqsService {
  constructor(@InjectRepository(Faq) private readonly repo: Repository<Faq>) {}

  findAll(category?: string) {
    const where: any = { is_active: true };
    if (category) where.category = category;
    return this.repo.find({ where, order: { category: "ASC", order_index: "ASC" } });
  }

  findAllAdmin() { return this.repo.find({ order: { category: "ASC", order_index: "ASC" } }); }

  create(dto: { category: string; question: string; answer: string }) { return this.repo.save(this.repo.create(dto)); }

  async update(id: string, dto: Partial<{ category: string; question: string; answer: string; is_active: boolean; order_index: number }>) {
    const faq = await this.repo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException("FAQ no encontrada");
    return this.repo.save({ ...faq, ...dto });
  }

  async remove(id: string) {
    const faq = await this.repo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException("FAQ no encontrada");
    await this.repo.remove(faq);
    return { message: "FAQ eliminada" };
  }
}
