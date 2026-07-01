import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Tutorial } from "./tutorial.entity";

@Injectable()
export class TutorialService {
  constructor(
    @InjectRepository(Tutorial) private readonly repo: Repository<Tutorial>,
  ) {}

  findAllPublished() {
    return this.repo.find({ where: { status: "published" }, order: { created_at: "DESC" }, take: 50 });
  }

  findAllAdmin() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: Partial<Tutorial>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<Tutorial>) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Tutorial no encontrado");
    return this.repo.save({ ...t, ...dto });
  }

  async remove(id: string) {
    const t = await this.repo.findOne({ where: { id } });
    if (!t) throw new NotFoundException("Tutorial no encontrado");
    return this.repo.remove(t);
  }
}
