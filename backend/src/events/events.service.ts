import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Event } from "./event.entity";

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private readonly repo: Repository<Event>,
  ) {}

  findAllPublished() {
    return this.repo.find({ where: { status: "published" }, order: { event_date: "DESC" }, take: 50 });
  }

  findAllAdmin() {
    return this.repo.find({ order: { created_at: "DESC" }, take: 200 });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: Partial<Event>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<Event>) {
    const ev = await this.repo.findOne({ where: { id } });
    if (!ev) throw new NotFoundException("Evento no encontrado");
    return this.repo.save({ ...ev, ...dto });
  }

  async remove(id: string) {
    const ev = await this.repo.findOne({ where: { id } });
    if (!ev) throw new NotFoundException("Evento no encontrado");
    return this.repo.remove(ev);
  }
}
