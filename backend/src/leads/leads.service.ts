import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Lead } from "./lead.entity";

@Injectable()
export class LeadsService {
  constructor(@InjectRepository(Lead) private readonly repo: Repository<Lead>) {}

  findAll() {
    return this.repo.find({ order: { created_at: "DESC" } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(dto: { first_name: string; last_name: string; email: string; phone?: string; message: string }) {
    return this.repo.save(this.repo.create(dto));
  }

  async remove(id: string) {
    const lead = await this.repo.findOne({ where: { id } });
    if (!lead) throw new NotFoundException("Lead no encontrado");
    await this.repo.remove(lead);
    return { message: "Lead eliminado" };
  }
}
