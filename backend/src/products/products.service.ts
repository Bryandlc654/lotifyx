import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { randomBytes } from "crypto";
import { Product } from "./product.entity";

function generateSku(): string {
  return `SKU-${randomBytes(4).toString("hex").toUpperCase()}`;
}

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private readonly repo: Repository<Product>) {}

  findAllActive(categoryId?: string) {
    const where: any = { status: "active" };
    if (categoryId) where.category_id = categoryId;
    return this.repo.find({ where, order: { created_at: "DESC" } });
  }

  findAllAdmin(status?: string) {
    const where: any = {};
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }
    return this.repo.find({ where, order: { created_at: "DESC" } });
  }

  findByUser(userId: string) {
    return this.repo.find({ where: { user_id: userId }, order: { created_at: "DESC" } });
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException("Producto no encontrado");
    return p;
  }

  async create(dto: Partial<Product>) {
    let sku = generateSku();
    while (await this.repo.findOne({ where: { sku } })) {
      sku = generateSku();
    }
    return this.repo.save(this.repo.create({ ...dto, sku, status: "pending_approval" }));
  }

  async update(id: string, dto: Partial<Product>) {
    const p = await this.findOne(id);
    return this.repo.save({ ...p, ...dto });
  }

  async remove(id: string) {
    const p = await this.findOne(id);
    await this.repo.remove(p);
    return { message: "Producto eliminado" };
  }

  async approve(id: string) {
    const p = await this.findOne(id);
    p.status = "active";
    return this.repo.save(p);
  }

  async reject(id: string) {
    const p = await this.findOne(id);
    p.status = "rejected";
    return this.repo.save(p);
  }
}
