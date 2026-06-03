import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Testimonial } from "./testimonial.entity";

@Injectable()
export class TestimonialsService {
  constructor(@InjectRepository(Testimonial) private readonly repo: Repository<Testimonial>) {}

  findAll() {
    return this.repo.find({ order: { order_index: "ASC" } });
  }

  create(dto: { stars: number; text: string; name: string; cargo: string }) {
    return this.repo.save(dto);
  }

  async update(id: string, dto: Partial<{ stars: number; text: string; name: string; cargo: string; is_active: boolean }>) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Testimonio no encontrado");
    return this.repo.save({ ...item, ...dto });
  }

  async remove(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Testimonio no encontrado");
    await this.repo.remove(item);
    return { message: "Testimonio eliminado" };
  }

  async reorder(ids: string[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { order_index: i });
    }
    return { message: "Orden actualizado" };
  }
}
