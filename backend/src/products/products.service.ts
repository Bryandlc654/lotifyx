import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, In, ILike, DataSource } from "typeorm";
import { randomBytes } from "crypto";
import { Product } from "./product.entity";
import { AuditService } from "../audit/audit.service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function generateSku(): string {
  return `SKU-${randomBytes(4).toString("hex").toUpperCase()}`;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
  ) {}

  async findAllActive(categoryId?: string, search?: string, limit?: number) {
    const where: any = { status: "active" };
    if (categoryId) {
      const children = await this.dataSource.query(
        `SELECT id FROM categories WHERE parent_id = $1 AND status = 'active'`,
        [categoryId],
      );
      const ids = [categoryId, ...children.map((c: any) => c.id)];
      where.category_id = ids.length === 1 ? ids[0] : In(ids);
    }
    if (search) where.title = ILike(`%${search}%`);
    return this.repo.find({ where, order: { created_at: "DESC" }, take: limit || 200 });
  }

  async findAllAdmin(status?: string, sort?: "ASC" | "DESC", page: number = DEFAULT_PAGE, limit: number = DEFAULT_LIMIT) {
    const where: any = {};
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      where, order: { created_at: sort || "DESC" }, take: limit, skip,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  findByUser(userId: string) {
    return this.repo.find({ where: { user_id: userId }, order: { created_at: "DESC" }, take: 200 });
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
    const product = await this.repo.save(this.repo.create({ ...dto, sku, status: "pending_approval" }));
    this.audit.log({ userId: dto.user_id, action: "product_created", entity: "product", entityId: product.id, details: { title: dto.title } });
    return product;
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
    const saved = await this.repo.save(p);
    this.audit.log({ action: "product_approved", entity: "product", entityId: id, details: { title: p.title } });
    return saved;
  }

  async reject(id: string) {
    const p = await this.findOne(id);
    p.status = "rejected";
    const saved = await this.repo.save(p);
    this.audit.log({ action: "product_rejected", entity: "product", entityId: id, details: { title: p.title } });
    return saved;
  }

  async registerView(id: string) {
    await this.dataSource.query(
      `UPDATE products SET views = views + 1 WHERE id = $1`,
      [id],
    );
    return { message: "ok" };
  }

  async toggleSave(productId: string, userId: string) {
    const existing = await this.dataSource.query(
      `SELECT id FROM product_saves WHERE user_id = $1 AND product_id = $2`,
      [userId, productId],
    );
    if (existing.length > 0) {
      await this.dataSource.query(
        `DELETE FROM product_saves WHERE user_id = $1 AND product_id = $2`,
        [userId, productId],
      );
      await this.dataSource.query(
        `UPDATE products SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = $1`,
        [productId],
      );
      return { saved: false };
    } else {
      await this.dataSource.query(
        `INSERT INTO product_saves (user_id, product_id) VALUES ($1, $2)`,
        [userId, productId],
      );
      await this.dataSource.query(
        `UPDATE products SET saves_count = saves_count + 1 WHERE id = $1`,
        [productId],
      );
      return { saved: true };
    }
  }

  async getSaveStatus(productId: string, userId: string) {
    const rows = await this.dataSource.query(
      `SELECT id FROM product_saves WHERE user_id = $1 AND product_id = $2`,
      [userId, productId],
    );
    return { saved: rows.length > 0 };
  }
}
