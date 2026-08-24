import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, In, ILike, IsNull, Not, DataSource } from "typeorm";
import { randomBytes } from "crypto";
import { Product } from "./product.entity";
import { AuditService } from "../audit/audit.service";
import { ConfigService } from "../config/config.service";

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
    private readonly config: ConfigService,
  ) {}

  async findAllActive(categoryId?: string, search?: string, limit?: number, precioMin?: number, precioMax?: number, ubicacion?: string, userId?: string, vendedor?: string, estado?: string) {
    const qb = this.repo.createQueryBuilder("p")
      .where("p.status = :status", { status: "active" })
      .andWhere("p.deleted_at IS NULL");
    if (categoryId) {
      const children = await this.dataSource.query(
        `SELECT id FROM categories WHERE parent_id = $1 AND status = 'active'`,
        [categoryId],
      );
      const ids = [categoryId, ...children.map((c: any) => c.id)];
      qb.andWhere("p.category_id IN (:...ids)", { ids });
    }
    // Búsqueda textual sobre el catálogo: título, especificaciones y zona
    if (search && search.trim()) {
      qb.andWhere("(p.title ILIKE :s OR p.specifications::text ILIKE :s OR COALESCE(p.distrito, '') ILIKE :s OR COALESCE(p.ubicacion, '') ILIKE :s)",
        { s: `%${search.trim()}%` });
    }
    // Filtro por rango de precio
    if (precioMin != null && Number.isFinite(precioMin)) {
      qb.andWhere("p.precio_base >= :precioMin", { precioMin });
    }
    if (precioMax != null && Number.isFinite(precioMax)) {
      qb.andWhere("p.precio_base <= :precioMax", { precioMax });
    }
    // Filtro por ubicación/zona (distrito, ciudad o dirección)
    if (ubicacion && ubicacion.trim()) {
      qb.andWhere("(COALESCE(p.distrito, '') ILIKE :u OR COALESCE(p.ubicacion, '') ILIKE :u OR COALESCE(p.direccion, '') ILIKE :u)",
        { u: `%${ubicacion.trim()}%` });
    }
    // Filtro por vendedor (exacto por id o textual por nombre/correo)
    if (userId && userId.trim()) {
      qb.andWhere("p.user_id = :uid", { uid: userId.trim() });
    }
    if (vendedor && vendedor.trim()) {
      qb.andWhere(
        `p.user_id IN (
          SELECT u.id FROM users u
          LEFT JOIN user_profiles up ON up.user_id = u.id
          WHERE u.email ILIKE :v
             OR COALESCE(up.first_name, '') || ' ' || COALESCE(up.last_name, '') ILIKE :v
        )`,
        { v: `%${vendedor.trim()}%` },
      );
    }
    // Filtro por condición del producto (nuevo | usado | reacondicionado)
    if (estado && estado.trim()) {
      qb.andWhere("LOWER(p.estado) = :estado", { estado: estado.trim().toLowerCase() });
    }
    // Priorización: publicaciones de vendedores con mayor reputación primero, luego más recientes
    qb.orderBy(
      `COALESCE((SELECT AVG(r.rating) FROM reviews r JOIN products rp ON rp.id = r.product_id WHERE rp.user_id = p.user_id AND r.is_active = true), 0)`,
      "DESC",
    ).addOrderBy("p.created_at", "DESC").take(limit || 200);
    const products = await qb.getMany();
    return this.attachAuctionAndLotInfo(products);
  }

  /** Adjunta datos de subasta activa (precio actual, cierre, pujas) y de lote (ahorro vs unitario) para el catálogo. */
  private async attachAuctionAndLotInfo(products: Product[]): Promise<any[]> {
    if (!products.length) return products;
    const ids = products.map(p => p.id);
    let auctions: any[] = [];
    let lots: any[] = [];
    try {
      auctions = await this.dataSource.query(
        `SELECT a.product_id, a.precio_actual, a.precio_inicial, a.fecha_fin, a.estado,
                (SELECT COUNT(*)::int FROM auction_bids b WHERE b.auction_id = a.id) AS pujas
         FROM auctions a WHERE a.product_id = ANY($1::uuid) AND a.estado = 'activo'`,
        [ids],
      );
      lots = await this.dataSource.query(
        `SELECT l.product_id, l.precio_lote, l.precio_individual, l.cantidad_total, l.estado
         FROM lot_sales l WHERE l.product_id = ANY($1::uuid) AND l.estado IN ('abierto','pausado')`,
        [ids],
      );
    } catch (e: any) {
      console.error("[Products] Error cargando info de subasta/lote:", e?.message);
    }
    const auctionByProduct = new Map(auctions.map(a => [a.product_id, a]));
    const lotByProduct = new Map(lots.map(l => [l.product_id, l]));
    return products.map(p => {
      const out: any = { ...p };
      const a = auctionByProduct.get(p.id);
      if (a) {
        out.auction_info = {
          precio_actual: Number(a.precio_actual ?? a.precio_inicial ?? 0),
          fecha_fin: a.fecha_fin,
          pujas: Number(a.pujas || 0),
        };
      }
      const l = lotByProduct.get(p.id);
      if (l) {
        const unitarioLote = Number(l.precio_individual ?? 0);
        const unitarioNormal = Number((p as any).precio_base ?? 0);
        out.lot_info = {
          precio_lote: Number(l.precio_lote ?? 0),
          precio_individual: unitarioLote,
          cantidad_total: Number(l.cantidad_total ?? 0),
          ahorro_unitario: unitarioNormal > unitarioLote ? Number((unitarioNormal - unitarioLote).toFixed(2)) : 0,
        };
      }
      return out;
    });
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

    // Precio no puede ser cero ni negativo (según el método de pago)
    this.validarPrecio(dto);

    // Condición obligatoria para productos físicos; no aplica a servicios
    this.validarCondicion(dto);
    // VI. Inmobiliario: tipo de operación obligatorio en categorías inmobiliarias
    await this.validarTipoOperacionInmobiliario(dto);

    // Detección de publicaciones duplicadas (mismo título, categoría y precio)
    await this.alertarDuplicado(dto);

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
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cantidad_total", "min_qty", "cmc", "cierre_estimado", "precio_objetivo", "canal", "modalidad", "divisible"]) {
      if ((dto as any)[field] === "" || (dto as any)[field] === undefined || (dto as any)[field] === null) {
        delete (dto as any)[field];
      }
    }
    const product = await this.repo.save(this.repo.create({ ...dto, sku, status: "pending_approval" }));
    this.audit.log({ userId: dto.user_id, action: "product_created", entity: "product", entityId: product.id, details: { title: dto.title } });

    // Auto-create auction/lot records based on metodo_pago
    try {
      if ((dto as any).metodo_pago === "subasta" && (dto as any).precio_inicial) {
        const tipoSubasta = (dto as any).tipo_subasta || (dto as any).modalidad || "inglesa";
        // El incremento mínimo solo aplica en subasta inglesa y se obtiene de Umbrales
        const inc = tipoSubasta === "inglesa"
          ? ((dto as any).incremento_minimo && Number((dto as any).incremento_minimo) > 0 ? Number((dto as any).incremento_minimo) : await this.config.getNum("incremento_minimo_subasta"))
          : 0;
        await this.dataSource.query(
          `INSERT INTO auctions (product_id, vendedor_id, precio_inicial, precio_actual, incremento_minimo, tipo_subasta, canal, precio_objetivo, divisible, fecha_inicio, fecha_fin, estado)
           VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, NOW(), $9, 'pendiente')
           ON CONFLICT (product_id) DO NOTHING`,
          [product.id, dto.user_id, (dto as any).precio_inicial, inc,
           tipoSubasta,
           (dto as any).canal || "subasta",
           (dto as any).precio_objetivo ?? null,
           (dto as any).divisible === true,
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

  /** Verifica si el usuario es administrador/superadmin (consulta la BD). */
  private async esAdmin(userId?: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const [row] = await this.dataSource.query(
        `SELECT r.name, r.is_admin FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
        [userId],
      );
      return !!row && (row.is_admin === true || row.name === "superadmin");
    } catch {
      return false;
    }
  }

  async update(id: string, dto: Partial<Product>, userId?: string, isAdminFlag = false) {
    const p = await this.findOne(id);
    // Propiedad: solo el vendedor dueño (o un administrador/superadmin) puede editar la publicación
    const adminOk = isAdminFlag || (await this.esAdmin(userId));
    if (userId && p.user_id !== userId && !adminOk) {
      throw new ForbiddenException("No puedes editar una publicación que no te pertenece");
    }
    // Precio no puede ser cero ni negativo (validación en edición)
    if ((dto as any).precio_base !== undefined || (dto as any).precio_inicial !== undefined
        || (dto as any).precio_lote !== undefined || (dto as any).precio_individual !== undefined) {
      this.validarPrecio({ ...p, ...dto } as any);
    }
    // Condición obligatoria para físicos en edición
    this.validarCondicion({ ...p, ...dto } as any);
    // VI. Inmobiliario: tipo de operación obligatorio en categorías inmobiliarias
    await this.validarTipoOperacionInmobiliario({ ...p, ...dto } as any);
    const specs = (dto.specifications || {}) as Record<string, string>;
    if ((dto.stock === undefined || dto.stock === null) && specs) {
      (dto as any).stock = parseInt(specs["Stock"] || specs["stock"] || String(p.stock)) || 0;
    }
    for (const field of ["precio_base", "precio_inicial", "incremento_minimo", "precio_lote", "precio_individual", "participantes_minimos", "cantidad_total", "min_qty", "cmc", "cierre_estimado", "precio_objetivo", "canal", "modalidad", "divisible"]) {
      if ((dto as any)[field] === "" || (dto as any)[field] === undefined || (dto as any)[field] === null) {
        delete (dto as any)[field];
      }
    }
    const saved = await this.repo.save({ ...p, ...dto });

    // Actualizar subasta si se modificaron campos de subasta
    if ((dto as any).cierre_estimado || (dto as any).precio_inicial || (dto as any).incremento_minimo || (dto as any).tipo_subasta || (dto as any).modalidad || (dto as any).canal || (dto as any).precio_objetivo !== undefined || (dto as any).divisible !== undefined) {
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
        const tipoSub = (dto as any).tipo_subasta || (dto as any).modalidad;
        if (tipoSub) {
          updates.push(`tipo_subasta = $${params.length + 1}`);
          params.push(tipoSub);
        }
        if ((dto as any).canal) {
          updates.push(`canal = $${params.length + 1}`);
          params.push((dto as any).canal);
        }
        if ((dto as any).precio_objetivo !== undefined) {
          updates.push(`precio_objetivo = $${params.length + 1}`);
          params.push((dto as any).precio_objetivo ?? null);
        }
        if ((dto as any).divisible !== undefined) {
          updates.push(`divisible = $${params.length + 1}`);
          params.push((dto as any).divisible === true);
        }
        // El incremento mínimo solo aplica en subasta inglesa y se obtiene de Umbrales
        if (tipoSub && tipoSub !== "inglesa") {
          updates.push(`incremento_minimo = 0`);
        } else if ((dto as any).incremento_minimo) {
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

    // Agotado automático: si el stock quedó en 0, marcar 'agotado'; si volvió a tener stock y estaba agotado, restaurar
    try {
      const stockFinal = Number(saved.stock || 0);
      if (stockFinal <= 0 && saved.status !== "paused") {
        if (saved.status !== "agotado") {
          await this.dataSource.query(`UPDATE products SET status = 'agotado' WHERE id = $1`, [id]);
          saved.status = "agotado";
        }
      } else if (stockFinal > 0 && saved.status === "agotado") {
        await this.dataSource.query(`UPDATE products SET status = 'active' WHERE id = $1`, [id]);
        saved.status = "active";
      }
    } catch (e: any) {
      console.error("[ProductsService] Error marcando agotado:", e.message);
    }

    return saved;
  }

  async remove(id: string, userId?: string, isAdminFlag = false) {
    const p = await this.findOne(id);
    const adminOk = isAdminFlag || (await this.esAdmin(userId));
    if (userId && p.user_id !== userId && !adminOk) {
      throw new ForbiddenException("No puedes eliminar una publicación que no te pertenece");
    }
    await this.dataSource.query(
      `UPDATE products SET deleted_at = NOW() WHERE id = $1`, [id]
    );
    this.audit.log({ action: "product_deleted", entity: "product", entityId: id });
    return { message: "Producto eliminado" };
  }

  /** Pausa o reanuda una publicación (el vendedor controla su disponibilidad). */
  async togglePause(id: string, userId?: string, isAdminFlag = false) {
    const p = await this.findOne(id);
    const adminOk = isAdminFlag || (await this.esAdmin(userId));
    if (userId && p.user_id !== userId && !adminOk) {
      throw new ForbiddenException("No puedes pausar una publicación que no te pertenece");
    }
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

  /** Expresión de interés inmobiliario (sin checkout estándar de transferencia). */
  async registerInterest(productId: string, userId: string, dto: { tipo_operacion?: string; mensaje?: string; monto_separo?: number | string }) {
    const [prod] = await this.dataSource.query(
      `SELECT id, user_id, tipo_inmobiliario FROM products WHERE id = $1 AND deleted_at IS NULL`,
      [productId],
    );
    if (!prod) throw new NotFoundException("Publicación no encontrada");
    if (prod.user_id === userId) throw new BadRequestException("No puedes expresar interés en tu propia publicación");
    const esInm = !!prod.tipo_inmobiliario;
    // La expresión de interés aplica a inmobiliarios (alquiler/venta); no usa el checkout estándar.
    const tipo = dto?.tipo_operacion || (prod.tipo_inmobiliario || "interes");
    // Monto que el interesado depositaría como separo/garantía (no equivale a transferencia de propiedad)
    let montoSeparo: number | null = null;
    if (dto?.monto_separo !== undefined && dto?.monto_separo !== null && dto?.monto_separo !== "") {
      const m = Number(dto.monto_separo);
      if (!Number.isFinite(m) || m <= 0) {
        throw new BadRequestException("El monto de separo/garantía debe ser mayor a cero");
      }
      montoSeparo = m;
    }
    await this.dataSource.query(
      `INSERT INTO inmob_interests (product_id, user_id, tipo_operacion, mensaje, monto_separo)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, userId, tipo, dto?.mensaje ? String(dto.mensaje) : null, montoSeparo],
    );
    return {
      message: esInm
        ? "Interés registrado. La gestión se realizará fuera del checkout estándar (LOTIFYX contactará a las partes). El separo o garantía no equivale a la transferencia de propiedad ni sustituye actos notariales o registrales."
        : "Interés registrado",
    };
  }

  /** Lista las expresiones de interés de una publicación (solo el vendedor o admin). */
  async listInterests(productId: string, userId: string, isAdmin = false) {
    const [prod] = await this.dataSource.query(`SELECT id, user_id FROM products WHERE id = $1 AND deleted_at IS NULL`, [productId]);
    if (!prod) throw new NotFoundException("Publicación no encontrada");
    if (prod.user_id !== userId && !isAdmin) throw new ForbiddenException("No tienes acceso a este inmueble");
    return this.dataSource.query(
      `SELECT i.*, u.email AS user_email, u.phone AS user_phone, up.first_name, up.last_name
       FROM inmob_interests i
       LEFT JOIN users u ON u.id = i.user_id
       LEFT JOIN user_profiles up ON up.user_id = i.user_id
       WHERE i.product_id = $1
       ORDER BY i.created_at DESC`,
      [productId],
    );
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

  /** VI. Inmobiliario: el tipo de operación (alquiler/venta) es obligatorio en categorías inmobiliarias. */
  private async validarTipoOperacionInmobiliario(dto: Partial<Product>) {
    if (!dto.category_id) return;
    try {
      const [cat] = await this.dataSource.query(
        `SELECT name FROM categories WHERE id = $1`, [dto.category_id],
      );
      if (cat && /inmob/i.test(String(cat.name || ""))) {
        const tipo = String((dto as any).tipo_inmobiliario || "").trim();
        if (!["alquiler", "venta"].includes(tipo)) {
          throw new BadRequestException("Inmobiliario: selecciona el tipo de operación (alquiler o venta)");
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      // si falla la consulta de categoría, no bloqueamos la publicación
    }
  }

  /** Valida que la condición sea obligatoria para productos físicos y no aplique a servicios. */
  private validarCondicion(dto: Partial<Product>) {
    if ((dto as any).es_servicio === true) return; // los servicios no usan condición
    const estado = String((dto as any).estado || "").trim();
    if (!estado || !["nuevo", "usado", "reacondicionado"].includes(estado)) {
      throw new BadRequestException("La condición del producto es obligatoria (Nuevo, Usado o Reacondicionado)");
    }
    // VI. Inmobiliario: campos obligatorios del formulario
    if ((dto as any).tipo_inmobiliario) {
      const metraje = Number((dto as any).metraje);
      if (!Number.isFinite(metraje) || metraje <= 0) {
        throw new BadRequestException("Inmobiliario: el metraje (m²) es obligatorio");
      }
      const habitaciones = Number((dto as any).habitaciones);
      if (!Number.isFinite(habitaciones) || habitaciones < 0) {
        throw new BadRequestException("Inmobiliario: indica el número de habitaciones");
      }
      const banos = Number((dto as any).banos);
      if (!Number.isFinite(banos) || banos < 0) {
        throw new BadRequestException("Inmobiliario: indica el número de baños");
      }
      if (!(dto as any).distrito || !String((dto as any).distrito).trim()) {
        throw new BadRequestException("Inmobiliario: el distrito es obligatorio");
      }
      if (!(dto as any).direccion || !String((dto as any).direccion).trim()) {
        throw new BadRequestException("Inmobiliario: la dirección es obligatoria");
      }
      const fotos = Array.isArray((dto as any).images) ? (dto as any).images.filter(Boolean) : [];
      if (fotos.length < 5) {
        throw new BadRequestException("Inmobiliario: adjunta al menos 5 fotografías del inmueble");
      }
      // Parámetros propios según mecanismo: alquiler requiere condiciones de contrato
      if ((dto as any).tipo_inmobiliario === "alquiler") {
        if (!(dto as any).duracion_contrato || !String((dto as any).duracion_contrato).trim()) {
          throw new BadRequestException("Alquiler: indica la duración del contrato (ej. 12 meses)");
        }
        const garantia = Number((dto as any).garantia_meses);
        if (!Number.isFinite(garantia) || garantia < 0) {
          throw new BadRequestException("Alquiler: indica los meses de garantía/depósito");
        }
      }
      // Separo/garantía: opcional, pero si se declara debe ser mayor a cero
      if ((dto as any).separo_monto !== undefined && (dto as any).separo_monto !== null && (dto as any).separo_monto !== "") {
        const separo = Number((dto as any).separo_monto);
        if (!Number.isFinite(separo) || separo <= 0) {
          throw new BadRequestException("El monto de separo/garantía debe ser mayor a cero");
        }
      }
    }
  }

  /** Valida que el precio de un producto sea mayor a cero (según método de pago). */
  private validarPrecio(dto: Partial<Product>) {
    const metodo = (dto as any).metodo_pago || "plataforma";
    if (metodo === "subasta") {
      const inicial = Number((dto as any).precio_inicial);
      if (!Number.isFinite(inicial) || inicial <= 0) {
        throw new BadRequestException("El precio inicial de la subasta debe ser mayor a cero");
      }
      return;
    }
    if (metodo === "venta_por_lote") {
      const lot = Number((dto as any).precio_lote);
      if (!Number.isFinite(lot) || lot <= 0) {
        throw new BadRequestException("El precio del lote debe ser mayor a cero");
      }
      const indiv = Number((dto as any).precio_individual);
      if ((dto as any).precio_individual !== undefined && (!Number.isFinite(indiv) || indiv <= 0)) {
        throw new BadRequestException("El precio individual debe ser mayor a cero");
      }
      return;
    }
    const base = Number((dto as any).precio_base);
    if (!Number.isFinite(base) || base <= 0) {
      throw new BadRequestException("El precio del producto debe ser mayor a cero");
    }
  }

  /** Detecta publicaciones duplicadas (mismo título, categoría y precio) y alerta al vendedor. */
  private async alertarDuplicado(dto: Partial<Product>) {
    try {
      const title = String(dto.title || "").trim().toLowerCase();
      if (!title || !dto.category_id || !dto.user_id) return;
      const precio = Number(
        (dto as any).precio_base ?? (dto as any).precio_inicial ?? (dto as any).precio_lote ?? (dto as any).precio_individual,
      );
      if (!Number.isFinite(precio)) return;
      const [dup] = await this.dataSource.query(
        `SELECT id FROM products
         WHERE user_id = $1 AND LOWER(title) = $2 AND category_id = $3 AND deleted_at IS NULL
           AND COALESCE(precio_base, precio_inicial, precio_lote, precio_individual, 0) = $4
         LIMIT 1`,
        [dto.user_id, title, dto.category_id, precio],
      );
      if (dup) {
        throw new BadRequestException(
          "Ya tienes una publicación con el mismo título, categoría y precio. Revisa si no la estás duplicando.",
        );
      }
    } catch (e: any) {
      if (e?.status === 400) throw e;
    }
  }
}
