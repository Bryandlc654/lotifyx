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
    const specs = (dto.specifications || {}) as Record<string, string>;
    if (dto.stock === undefined || dto.stock === null) {
      (dto as any).stock = parseInt(specs["Stock"] || specs["stock"] || "0") || 0;
    }
    // Clean empty decimal/date fields for auction/lot
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cierre_estimado"]) {
      if ((dto as any)[field] === "" || (dto as any)[field] === undefined || (dto as any)[field] === null) {
        delete (dto as any)[field];
      }
    }
    const product = await this.repo.save(this.repo.create({ ...dto, sku, status: "pending_approval" }));
    this.audit.log({ userId: dto.user_id, action: "product_created", entity: "product", entityId: product.id, details: { title: dto.title } });

    // Auto-create auction/lot records based on metodo_pago
    try {
      if ((dto as any).metodo_pago === "subasta" && (dto as any).precio_inicial) {
        await this.dataSource.query(
          `INSERT INTO auctions (product_id, vendedor_id, precio_inicial, precio_actual, incremento_minimo, fecha_inicio, fecha_fin, estado)
           VALUES ($1, $2, $3, $3, $4, NOW(), $5, 'activo')
           ON CONFLICT (product_id) DO NOTHING`,
          [product.id, dto.user_id, (dto as any).precio_inicial, (dto as any).incremento_minimo || 1,
           (dto as any).cierre_estimado ? new Date((dto as any).cierre_estimado) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );
      }
      if ((dto as any).metodo_pago === "venta_por_lote" && (dto as any).precio_lote) {
        await this.dataSource.query(
          `INSERT INTO lot_sales (product_id, vendedor_id, precio_lote, precio_individual, participantes_minimos, fecha_cierre, estado)
           VALUES ($1, $2, $3, $4, $5, $6, 'abierto')
           ON CONFLICT (product_id) DO NOTHING`,
          [product.id, dto.user_id, (dto as any).precio_lote, (dto as any).precio_individual || 0,
           (dto as any).participantes_minimos || 1,
           (dto as any).cierre_estimado ? new Date((dto as any).cierre_estimado) : null]
        );
      }
    } catch (e) {
      console.error("[ProductsService] Error creating auction/lot:", (e as any).message);
    }

    return product;
  }

  async update(id: string, dto: Partial<Product>) {
    const p = await this.findOne(id);
    const specs = (dto.specifications || {}) as Record<string, string>;
    if ((dto.stock === undefined || dto.stock === null) && specs) {
      (dto as any).stock = parseInt(specs["Stock"] || specs["stock"] || String(p.stock)) || 0;
    }
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cierre_estimado"]) {
      if ((dto as any)[field] === "" || (dto as any)[field] === undefined || (dto as any)[field] === null) {
        delete (dto as any)[field];
      }
    }
    return this.repo.save({ ...p, ...dto });
  }

  async remove(id: string) {
    const p = await this.findOne(id);
    await this.repo.softRemove(p);
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
