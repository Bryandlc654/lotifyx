import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { ProductVerification } from "./verification.entity";

const VERIFICABLE_METHODS = ["subasta", "venta_por_lote"];

@Injectable()
export class VerificationsService {
  constructor(
    @InjectRepository(ProductVerification)
    private readonly repo: Repository<ProductVerification>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async getForProduct(productId: string) {
    const row = await this.repo.findOne({ where: { product_id: productId } });
    return row || null;
  }

  /** Envío / reenvío de evidencia por parte del vendedor */
  async submit(productId: string, sellerId: string, dto: any) {
    const [p] = await this.dataSource.query(
      `SELECT p.id, p.user_id, p.metodo_pago, p.estado, p.ubicacion, p.title, p.tipo_inmobiliario,
              c.name AS category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1 AND p.deleted_at IS NULL`,
      [productId],
    );
    if (!p) throw new NotFoundException("Producto no encontrado");
    if (p.user_id !== sellerId) throw new ForbiddenException("Solo el vendedor del producto puede enviar la verificación");
    const esInmobiliario = !!p.tipo_inmobiliario || /inmob/i.test(p.category_name || "");
    if (!VERIFICABLE_METHODS.includes(p.metodo_pago) && !esInmobiliario) {
      throw new BadRequestException("La verificación aplica a subastas, compra grupal (venta por lote) o publicaciones inmobiliarias.");
    }

    const payload = dto?.payload || {};
    const fotografias = Array.isArray(payload.fotografias) ? payload.fotografias.filter(Boolean) : [];
    const documentos = Array.isArray(payload.documentos) ? payload.documentos.filter(Boolean) : [];
    const capacidad = payload.capacidad_produccion || {};

    if (fotografias.length === 0) {
      throw new BadRequestException("Adjunta al menos una fotografía de la evidencia del stock o del bien");
    }
    if (!p.estado) {
      throw new BadRequestException("Indica la condición del producto (nuevo, usado o reacondicionado)");
    }
    if (!p.ubicacion) {
      throw new BadRequestException("Indica la ubicación del bien");
    }
    if (p.metodo_pago === "venta_por_lote" && !esInmobiliario && (!capacidad.unidades_mes || Number(capacidad.unidades_mes) <= 0)) {
      throw new BadRequestException("Para compra grupal indica tu capacidad de producción o suministro (unidades por mes)");
    }
    // VI. Verificación reforzada inmobiliaria: partida registral, cargas/gravámenes y facultades del anunciante
    if (esInmobiliario) {
      if (!payload.partida_registral || !String(payload.partida_registral).trim()) {
        throw new BadRequestException("Inmobiliario: indica la partida registral del inmueble");
      }
      if (!payload.declaracion_cargas || payload.declaracion_cargas !== true) {
        throw new BadRequestException("Inmobiliario: declara que no existen cargas o gravámenes ocultos sobre el inmueble");
      }
      if (!payload.titular_anunciante || !String(payload.titular_anunciante).trim()) {
        throw new BadRequestException("Inmobiliario: declara la titularidad o mandato del anunciante sobre el inmueble");
      }
    }
    if (payload.declaracion_ficha !== true) {
      throw new BadRequestException("Debes declarar que la ficha técnica es correcta y corresponde con la evidencia");
    }

    const clean = {
      fotografias,
      video: payload.video ? String(payload.video) : "",
      numero_serie: payload.numero_serie ? String(payload.numero_serie) : "",
      documentos,
      capacidad_produccion: p.metodo_pago === "venta_por_lote" && !esInmobiliario
        ? { unidades_mes: Number(capacidad.unidades_mes) || 0, plazo: capacidad.plazo ? String(capacidad.plazo) : "" }
        : null,
      // VI. Inmobiliario reforzado
      inmobiliario: esInmobiliario
        ? {
            partida_registral: String(payload.partida_registral || ""),
            titular_anunciante: String(payload.titular_anunciante || ""),
            declaracion_cargas: true,
            tipo: p.tipo_inmobiliario || "",
          }
        : null,
      declaracion_ficha: true,
    };

    const existing = await this.repo.findOne({ where: { product_id: productId } });
    let saved: ProductVerification;
    if (existing) {
      existing.payload = clean;
      existing.estado = "pendiente";
      existing.observaciones = null;
      saved = await this.repo.save(existing);
    } else {
      saved = await this.repo.save(this.repo.create({ product_id: productId, payload: clean, estado: "pendiente" }));
    }

    await this.dataSource.query(
      `UPDATE products SET verification_status = 'pendiente' WHERE id = $1`, [productId],
    );
    return saved;
  }

  async approve(verificationId: string, adminId: string, observaciones?: string) {
    const v = await this.repo.findOne({ where: { id: verificationId } });
    if (!v) throw new NotFoundException("Verificación no encontrada");
    v.estado = "aprobada";
    v.revisado_por = adminId;
    v.revisado_at = new Date();
    v.observaciones = observaciones || null;
    const saved = await this.repo.save(v);
    await this.dataSource.query(
      `UPDATE products SET verification_status = 'approved' WHERE id = $1`, [v.product_id],
    );
    return saved;
  }

  async reject(verificationId: string, adminId: string, observaciones: string) {
    if (!observaciones || !observaciones.trim()) {
      throw new BadRequestException("Indica el motivo del rechazo para que el vendedor pueda corregir");
    }
    const v = await this.repo.findOne({ where: { id: verificationId } });
    if (!v) throw new NotFoundException("Verificación no encontrada");
    v.estado = "rechazada";
    v.revisado_por = adminId;
    v.revisado_at = new Date();
    v.observaciones = observaciones;
    const saved = await this.repo.save(v);
    await this.dataSource.query(
      `UPDATE products SET verification_status = 'rejected' WHERE id = $1`, [v.product_id],
    );
    return saved;
  }

  async listForAdmin(estado?: string) {
    const rows = await this.dataSource.query(
      `SELECT v.id, v.product_id, v.payload, v.estado, v.revisado_por, v.revisado_at, v.observaciones, v.created_at,
              p.title, p.sku, p.metodo_pago, p.specifications, p.estado AS product_estado, p.ubicacion,
              p.verification_status, p.verification_required,
              u.email AS seller_email,
              c.name AS category_name
       FROM product_verifications v
       JOIN products p ON p.id = v.product_id
       JOIN users u ON u.id = p.user_id
       JOIN categories c ON c.id = p.category_id
       WHERE ($1 = '' OR v.estado = $1)
       ORDER BY v.created_at DESC`,
      [estado || ""],
    );
    return rows;
  }

  /** Vendedor: estado de verificación junto al producto */
  async getByProduct(productId: string, sellerId: string) {
    const [p] = await this.dataSource.query(
      `SELECT id, user_id, metodo_pago FROM products WHERE id = $1 AND deleted_at IS NULL`, [productId],
    );
    if (!p) throw new NotFoundException("Producto no encontrado");
    if (p.user_id !== sellerId) throw new ForbiddenException("No tienes acceso a este producto");
    const v = await this.repo.findOne({ where: { product_id: productId } });
    return { product: p, verification: v };
  }
}
