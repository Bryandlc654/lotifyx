import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Plan } from "./plan.entity";

@Injectable()
export class PlansService {
  constructor(@InjectRepository(Plan) private readonly repo: Repository<Plan>) {}

  findAll() { return this.repo.find({ order: { order_index: "ASC" } }); }

  findOne(id: string) { return this.repo.findOne({ where: { id } }); }

  create(dto: { name: string; description?: string; price: number; max_products: number; max_featured?: number; duration_days?: number; icon?: string }) {
    return this.repo.save(this.repo.create({
      ...dto, max_featured: dto.max_featured || 0, duration_days: dto.duration_days || 30,
    }));
  }

  async update(id: string, dto: Partial<{ name: string; description: string; price: number; max_products: number; max_featured: number; duration_days: number; icon: string; is_active: boolean; order_index: number }>) {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException("Plan no encontrado");
    return this.repo.save({ ...plan, ...dto });
  }

  async remove(id: string) {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) throw new NotFoundException("Plan no encontrado");
    await this.repo.remove(plan);
    return { message: "Plan eliminado" };
  }
}
