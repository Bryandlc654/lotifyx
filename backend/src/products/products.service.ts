import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, In, ILike, IsNull, Not, DataSource } from "typeorm";
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
    const where: any = { status: "active", deleted_at: IsNull() };
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

  async findAllAdmin(status?: string, sort?: "ASC" | "DESC", page: number = DEFAULT_PAGE, limit: number = DEFAULT_LIMIT, notMetodoPago?: string) {
    const where: any = { deleted_at: IsNull() };
    if (status) {
      const statuses = status.split(",");
      where.status = statuses.length === 1 ? statuses[0] : In(statuses);
    }
    if (notMetodoPago) where.metodo_pago = Not(notMetodoPago);
    const skip = (page - 1) * limit;
    const [data, total] = await this.repo.findAndCount({
      where, order: { created_at: sort || "DESC" }, take: limit, skip,
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  /** Lista productos de venta por lote con datos del lote para el panel de admin */
  async findAdminLots(status?: string, sort: "ASC" | "DESC" = "DESC", page: number = DEFAULT_PAGE, limit: number = DEFAULT_LIMIT) {
    const clauses: string[] = ["p.deleted_at IS NULL", "p.metodo_pago = 'venta_por_lote'"];
    const params: any[] = [];
    if (status) {
      const statuses = status.split(",").filter(Boolean);
      if (statuses.length === 1) {
        params.push(statuses[0]);
        clauses.push(`p.status = $${params.length}`);
      } else if (statuses.length > 1) {
        params.push(statuses);
        clauses.push(`p.status = ANY($${params.length})`);
      }
    }
    const where = clauses.join(" AND ");
    const orderBy = sort === "ASC" ? "ASC" : "DESC";
    const countRows = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM products p WHERE ${where}`,
      params,
    );
    const rows = await this.dataSource.query(
      `SELECT p.id, p.title, p.sku, p.user_id, p.category_id, p.status, p.stock, p.created_at,
              p.precio_lote, p.precio_individual, p.participantes_minimos, p.cmc, p.cantidad_total, p.cierre_estimado,
              l.estado AS lot_estado, l.meta_venta, l.destacado,
              COALESCE((SELECT SUM(lp.cantidad) FROM lot_participants lp WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado'), 0) AS cantidad_reservada,
              (SELECT COUNT(*) FROM lot_participants lp WHERE lp.lot_sale_id = l.id AND lp.estado = 'reservado') AS participantes_count,
              COALESCE(
                (SELECT json_agg(json_build_object(
                   'id', t.id, 'desde', t.desde, 'hasta', t.hasta,
                   'tipo_beneficio', t.tipo_beneficio, 'valor', t.valor,
                   'activacion', t.activacion, 'descripcion', t.descripcion)
                 ORDER BY t.desde ASC)
                 FROM lot_rcg_tiers t WHERE t.lot_sale_id = l.id),
                '[]'::json) AS rcg_tiers
       FROM products p
       LEFT JOIN lot_sales l ON l.product_id = p.id
       WHERE ${where}
       ORDER BY p.created_at ${orderBy}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit],
    );
    const total = countRows[0]?.total || 0;
    const data = rows.map((r: any) => {
      let rcg_tiers: any[] = [];
      try { rcg_tiers = Array.isArray(r.rcg_tiers) ? r.rcg_tiers : []; } catch { rcg_tiers = []; }
      return { ...r, rcg_tiers, meta_venta: r.meta_venta ? Number(r.meta_venta) : null, destacado: r.destacado === true || r.destacado === "t" };
    });
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string) {
    const rows = await this.dataSource.query(
      `SELECT p.*, a.estado AS auction_estado,
              l.estado AS lot_estado, l.cantidad_total AS lot_cantidad_total,
              l.cantidad_reservada AS lot_cantidad_reservada,
              l.participantes_minimos AS lot_participantes_minimos
       FROM products p
       LEFT JOIN auctions a ON a.product_id = p.id
       LEFT JOIN lot_sales l ON l.product_id = p.id
       WHERE p.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 200`,
      [userId],
    );
    return rows;
  }

  async findOne(id: string) {
    const p = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!p) throw new NotFoundException("Producto no encontrado");
    return p;
  }

  async findOnePublic(id: string) {
    const p = await this.repo.findOne({ where: { id, status: "active", deleted_at: IsNull() } });
    if (!p) throw new NotFoundException("Producto no encontrado");
    // Datos públicos del vendedor (nombre + verificación) para mostrarlo en el detalle del producto
    let seller: any = null;
    try {
      const [row] = await this.dataSource.query(
        `SELECT u.id, u.is_verified, up.first_name, up.last_name, up.avatar_url,
                (SELECT COUNT(*)::int FROM products pr
                 WHERE pr.user_id = u.id AND pr.status = 'active' AND pr.deleted_at IS NULL) AS products_count,
                (SELECT COUNT(r.id)::int FROM reviews r
                 INNER JOIN products p2 ON p2.id = r.product_id AND p2.user_id = u.id
                 WHERE r.is_active = true) AS total_reviews,
                (SELECT COALESCE(ROUND(AVG(r2.rating)::numeric, 2), 0)::numeric FROM reviews r2
                 INNER JOIN products p3 ON p3.id = r2.product_id AND p3.user_id = u.id
                 WHERE r2.is_active = true) AS average_rating
         FROM users u
         LEFT JOIN user_profiles up ON up.user_id = u.id
         WHERE u.id = $1`,
        [p.user_id],
      );
      if (row) {
        seller = {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          avatar_url: row.avatar_url,
          is_verified: !!row.is_verified,
          products_count: Number(row.products_count || 0),
          average_rating: Number(row.average_rating || 0),
          total_reviews: Number(row.total_reviews || 0),
        };
      }
    } catch (e: any) {
      console.error("[Products] Error cargando vendedor:", e.message);
    }
    // Variantes de la publicación
    let variants: any[] = [];
    try {
      variants = await this.dataSource.query(
        `SELECT id, name, attributes, price, stock FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC`,
        [p.id],
      );
    } catch (e: any) {
      console.error("[Products] Error cargando variantes:", e.message);
    }
    return { ...p, seller, variants };
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
    // III.4: si la categoría exige verificación y el método es subasta/compra grupal, se marca como requerida
    if ((dto as any).metodo_pago === "subasta" || (dto as any).metodo_pago === "venta_por_lote") {
      try {
        const [cat] = await this.dataSource.query(
          `SELECT require_verification FROM categories WHERE id = $1`, [dto.category_id],
        );
        if (cat?.require_verification) (dto as any).verification_required = true;
      } catch {}
    }
    // Clean empty decimal/date fields for auction/lot
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cantidad_total", "min_qty", "cmc", "cierre_estimado"]) {
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
           VALUES ($1, $2, $3, $3, $4, NOW(), $5, 'pendiente')
           ON CONFLICT (product_id) DO NOTHING`,
          [product.id, dto.user_id, (dto as any).precio_inicial, (dto as any).incremento_minimo || 1,
           (dto as any).cierre_estimado ? new Date((dto as any).cierre_estimado) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        );
      }
      if ((dto as any).metodo_pago === "venta_por_lote" && (dto as any).precio_lote) {
        await this.dataSource.query(
          `INSERT INTO lot_sales (product_id, vendedor_id, precio_lote, precio_individual, participantes_minimos, cmc, cantidad_total, divisible, fecha_cierre, estado)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pendiente')
           ON CONFLICT (product_id) DO NOTHING`,
          [product.id, dto.user_id, (dto as any).precio_lote, (dto as any).precio_individual || 0,
           (dto as any).participantes_minimos || 1,
           (dto as any).cmc || 1,
           (dto as any).cantidad_total || 1,
           (dto as any).divisible !== false,
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
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cantidad_total", "min_qty", "cmc", "cierre_estimado"]) {
      if ((dto as any)[field] === "" || (dto as any)[field] === undefined || (dto as any)[field] === null) {
        delete (dto as any)[field];
      }
    }
    const saved = await this.repo.save({ ...p, ...dto });

    // Actualizar subasta si se modificaron campos de subasta
    if ((dto as any).cierre_estimado || (dto as any).precio_inicial || (dto as any).incremento_minimo) {
      try {
        const updates: string[] = [];
        const params: any[] = [id];
        if ((dto as any).cierre_estimado) {
          updates.push(`fecha_fin = $${params.length + 1}`);
          params.push(new Date((dto as any).cierre_estimado));
        }
        if ((dto as any).precio_inicial) {
          updates.push(`precio_inicial = $${params.length + 1}, precio_actual = $${params.length + 1}`);
          params.push((dto as any).precio_inicial);
        }
        if ((dto as any).incremento_minimo) {
          updates.push(`incremento_minimo = $${params.length + 1}`);
          params.push((dto as any).incremento_minimo);
        }
        if (updates.length > 0) {
          await this.dataSource.query(
            `UPDATE auctions SET ${updates.join(", ")} WHERE product_id = $1`,
            params
          );
        }
      } catch (e: any) {
        console.error("[ProductsService] Error updating auction:", e.message);
      }
    }

    // Actualizar lote si se modificaron campos de venta por lote
    if ((dto as any).metodo_pago === "venta_por_lote" &&
        ((dto as any).cierre_estimado || (dto as any).precio_lote || (dto as any).precio_individual || (dto as any).participantes_minimos || (dto as any).cmc || (dto as any).cantidad_total || (dto as any).divisible !== undefined)) {
      try {
        const updates: string[] = [];
        const params: any[] = [id];
        if ((dto as any).cierre_estimado) {
          updates.push(`fecha_cierre = $${params.length + 1}`);
          params.push(new Date((dto as any).cierre_estimado));
        }
        if ((dto as any).precio_lote) {
          updates.push(`precio_lote = $${params.length + 1}`);
          params.push((dto as any).precio_lote);
        }
        if ((dto as any).precio_individual) {
          updates.push(`precio_individual = $${params.length + 1}`);
          params.push((dto as any).precio_individual);
        }
        if ((dto as any).participantes_minimos) {
          updates.push(`participantes_minimos = $${params.length + 1}`);
          params.push((dto as any).participantes_minimos);
        }
        if ((dto as any).cmc) {
          updates.push(`cmc = $${params.length + 1}`);
          params.push((dto as any).cmc);
        }
        if ((dto as any).cantidad_total) {
          updates.push(`cantidad_total = $${params.length + 1}`);
          params.push((dto as any).cantidad_total);
        }
        if ((dto as any).divisible !== undefined) {
          updates.push(`divisible = $${params.length + 1}`);
          params.push(!!(dto as any).divisible);
        }
        if (updates.length > 0) {
          await this.dataSource.query(
            `UPDATE lot_sales SET ${updates.join(", ")} WHERE product_id = $1`,
            params
          );
        }
      } catch (e: any) {
        console.error("[ProductsService] Error updating lot:", e.message);
      }
    }

    return saved;
  }

  async remove(id: string) {
    await this.dataSource.query(
      `UPDATE products SET deleted_at = NOW() WHERE id = $1`, [id]
    );
    this.audit.log({ action: "product_deleted", entity: "product", entityId: id });
    return { message: "Producto eliminado" };
  }

  /** Pausa o reanuda una publicación (el vendedor controla su disponibilidad). */
  async togglePause(id: string) {
    const p = await this.findOne(id);
    const isPaused = p.status === "paused";
    const newStatus = isPaused ? "active" : "paused";
    await this.dataSource.query(
      `UPDATE products SET status = $2, updated_at = NOW() WHERE id = $1`,
      [id, newStatus],
    );
    // Pausar/reanudar también la subasta o el lote asociado
    if (newStatus === "paused") {
      await this.dataSource.query(
        `UPDATE auctions SET estado = 'pausada' WHERE product_id = $1 AND estado = 'activo'`,
        [id],
      );
      await this.dataSource.query(
        `UPDATE lot_sales SET estado = 'pausado' WHERE product_id = $1 AND estado = 'abierto'`,
        [id],
      );
    } else {
      await this.dataSource.query(
        `UPDATE auctions SET estado = 'activo' WHERE product_id = $1 AND estado = 'pausada'`,
        [id],
      );
      await this.dataSource.query(
        `UPDATE lot_sales SET estado = 'abierto' WHERE product_id = $1 AND estado = 'pausado'`,
        [id],
      );
    }
    this.audit.log({ userId: p.user_id, action: isPaused ? "product_unpaused" : "product_paused", entity: "product", entityId: id });
    return { message: isPaused ? "Publicación reanudada" : "Publicación pausada", status: newStatus };
  }

  async approve(id: string) {
    const p = await this.findOne(id);
    const [seller] = await this.dataSource.query(
      `SELECT status FROM users WHERE id = $1`,
      [p.user_id],
    );
    if (seller && seller.status === "disabled") {
      throw new BadRequestException("El vendedor está deshabilitado. No se puede activar el producto.");
    }
    // VI. Inmobiliario: diferenciado y aprobado por LOTIFYX
    const esInmobiliario = await this.esInmobiliario(p.category_id);
    if (esInmobiliario) {
      if (!p.tipo_inmobiliario || !["alquiler", "venta"].includes(p.tipo_inmobiliario)) {
        throw new BadRequestException(
          "Para publicaciones inmobiliarias debes indicar el tipo: Alquiler o Venta.",
        );
      }
      // Verificación reforzada: identidad/facultades, partida registral y cargas/gravámenes
      if (p.verification_status !== "approved") {
        throw new BadRequestException(
          "La publicación inmobiliaria requiere verificación reforzada por LOTIFYX (partida registral y cargas/gravámenes) antes de activarse.",
        );
      }
    }
    // III.4: bloqueo si la categoría/método exige verificación de stock y ficha técnica y aún no está aprobada
    if (p.metodo_pago === "subasta" || p.metodo_pago === "venta_por_lote") {
      let catRequires = false;
      try {
        const [cat] = await this.dataSource.query(
          `SELECT require_verification FROM categories WHERE id = $1`, [p.category_id],
        );
        catRequires = !!cat?.require_verification;
      } catch {}
      const required = p.verification_required === true || catRequires;
      if (required && p.verification_status !== "approved") {
        throw new BadRequestException(
          "Este producto requiere verificación de stock y ficha técnica por LOTIFYX antes de activar la subasta o compra grupal.",
        );
      }
    }
    p.status = "active";
    const saved = await this.repo.save(p);
    this.audit.log({ action: "product_approved", entity: "product", entityId: id, details: { title: p.title } });
    try {
      await this.dataSource.query(
        `UPDATE auctions SET estado = 'activo', fecha_inicio = NOW()
         WHERE product_id = $1 AND estado = 'pendiente'`,
        [id],
      );
      await this.dataSource.query(
        `UPDATE lot_sales SET estado = 'abierto'
         WHERE product_id = $1 AND estado = 'pendiente'`,
        [id],
      );
    } catch {}
    return saved;
  }

  async reject(id: string) {
    const p = await this.findOne(id);
    p.status = "rejected";
    const saved = await this.repo.save(p);
    this.audit.log({ action: "product_rejected", entity: "product", entityId: id, details: { title: p.title } });
    return saved;
  }

  async registerView(id: string, userId?: string) {
    await this.dataSource.query(
      `UPDATE products SET views = views + 1 WHERE id = $1`,
      [id],
    );
    if (userId) {
      this.dataSource.query(
        `INSERT INTO product_views (user_id, product_id) VALUES ($1, $2)`,
        [userId, id],
      ).catch(() => {});
    }
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

  // ─── Variantes por publicación ───────────────────────────

  async getVariants(productId: string) {
    return this.dataSource.query(
      `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY created_at ASC`,
      [productId],
    );
  }

  async addVariant(productId: string, userId: string, dto: { name: string; attributes?: Record<string, any>; price?: number; stock?: number }) {
    await this.assertOwner(productId, userId);
    const name = String(dto?.name || "").trim();
    if (!name) throw new BadRequestException("El nombre de la variante es obligatorio");
    const [row] = await this.dataSource.query(
      `INSERT INTO product_variants (product_id, name, attributes, price, stock)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [productId, name, dto?.attributes || {}, dto?.price ?? null, Math.max(0, Math.floor(Number(dto?.stock) || 0))],
    );
    await this.recalcTotalStock(productId);
    return row;
  }

  async updateVariant(variantId: string, userId: string, dto: { name?: string; attributes?: Record<string, any>; price?: number; stock?: number }) {
    const v = await this.getVariantForUser(variantId, userId);
    const sets: string[] = [];
    const params: any[] = [variantId];
    if (dto?.name !== undefined) { params.push(String(dto.name)); sets.push(`name = $${params.length}`); }
    if (dto?.attributes !== undefined) { params.push(dto.attributes); sets.push(`attributes = $${params.length}`); }
    if (dto?.price !== undefined) { params.push(dto.price ?? null); sets.push(`price = $${params.length}`); }
    if (dto?.stock !== undefined) { params.push(Math.max(0, Math.floor(Number(dto.stock) || 0))); sets.push(`stock = $${params.length}`); }
    if (sets.length > 0) {
      await this.dataSource.query(`UPDATE product_variants SET ${sets.join(", ")} WHERE id = $1`, params);
    }
    const [updated] = await this.dataSource.query(`SELECT * FROM product_variants WHERE id = $1`, [variantId]);
    await this.recalcTotalStock(v.product_id);
    return updated;
  }

  async deleteVariant(variantId: string, userId: string) {
    const v = await this.getVariantForUser(variantId, userId);
    await this.dataSource.query(`DELETE FROM product_variants WHERE id = $1`, [variantId]);
    await this.recalcTotalStock(v.product_id);
    return { message: "Variante eliminada" };
  }

  private async assertOwner(productId: string, userId: string) {
    const p = await this.findOne(productId);
    if (p.user_id !== userId) throw new NotFoundException("Producto no encontrado");
    return p;
  }

  private async getVariantForUser(variantId: string, userId: string) {
    const [v] = await this.dataSource.query(
      `SELECT * FROM product_variants WHERE id = $1`,
      [variantId],
    );
    if (!v) throw new NotFoundException("Variante no encontrada");
    await this.assertOwner(v.product_id, userId);
    return v;
  }

  /** Recalcula el stock total del producto como la suma del stock de sus variantes (si tiene variantes). */
  private async recalcTotalStock(productId: string) {
    const [agg] = await this.dataSource.query(
      `SELECT COALESCE(SUM(stock), 0)::int AS total, COUNT(*)::int AS n FROM product_variants WHERE product_id = $1`,
      [productId],
    );
    if (Number(agg?.n || 0) > 0) {
      await this.dataSource.query(`UPDATE products SET stock = $2 WHERE id = $1`, [productId, Number(agg.total || 0)]);
    }
  }

  /** Detecta si la categoría es inmobiliaria (por nombre). */
  private async esInmobiliario(categoryId: string): Promise<boolean> {
    try {
      const [cat] = await this.dataSource.query(
        `SELECT name FROM categories WHERE id = $1`,
        [categoryId],
      );
      return !!cat && /inmob/i.test(cat.name || "");
    } catch {
      return false;
    }
  }
}
