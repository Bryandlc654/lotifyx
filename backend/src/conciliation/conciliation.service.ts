import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { randomUUID } from "crypto";
import { AuditService } from "../audit/audit.service";
import { CheckoutService } from "../checkout/checkout.service";

/** Registro de un pago manual hecho por el administrador */
export interface ManualPaymentDto {
  order_id?: string;
  user_email?: string;
  operation_number?: string;
  amount: number;
  bank?: string;
  notes?: string;
}

@Injectable()
export class ConciliationService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly audit: AuditService,
    private readonly checkoutService: CheckoutService,
  ) {}

  /** RF: El sistema permitirá registrar pagos manuales por parte del administrador. */
  async registerManualPayment(adminId: string, dto: ManualPaymentDto, proofUrl?: string) {
    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException("Ingresa un monto válido");
    if (!dto.operation_number?.trim() && !dto.order_id?.trim()) {
      throw new BadRequestException("Indica el número de operación o el pedido asociado");
    }

    let orderId: string | null = dto.order_id?.trim() || null;
    if (orderId) {
      const [order] = await this.dataSource.query(`SELECT id, status, amount, total_amount FROM orders WHERE id = $1`, [orderId]);
      if (!order) throw new BadRequestException("El pedido indicado no existe");
      if (!["pending_payment", "paid"].includes(order.status)) {
        throw new BadRequestException(`El pedido está en estado "${order.status}" y no admite registro de pago`);
      }
      // Validación de coincidencia de montos entre el pedido y el pago registrado
      const expected = Number(order.amount ?? order.total_amount);
      if (Math.abs(expected - amount) >= 0.01) {
        throw new BadRequestException(
          `El monto no coincide con el pedido: esperado S/ ${expected.toFixed(2)}, recibido S/ ${amount.toFixed(2)}`
        );
      }
    }

    const [payment] = await this.dataSource.query(
      `INSERT INTO payments_manual (registered_by, user_email, order_id, operation_number, amount, bank, notes, proof_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [adminId, dto.user_email?.trim() || null, orderId, dto.operation_number?.trim() || null, amount, dto.bank?.trim() || null, dto.notes?.trim() || null, proofUrl || null],
    );

    // Si el pago manual corresponde a un pedido pendiente, se confirma automáticamente
    let orderApproved = false;
    if (orderId) {
      const [order] = await this.dataSource.query(`SELECT status FROM orders WHERE id = $1`, [orderId]);
      if (order?.status === "pending_payment") {
        await this.checkoutService.approveOrder(orderId, adminId);
        orderApproved = true;
      }
    }

    this.audit.log({
      userId: adminId,
      action: "manual_payment_registered",
      entity: "payment",
      entityId: payment.id,
      details: { orderId, amount, operation_number: dto.operation_number, orderApproved },
    });

    return { message: "Pago manual registrado", payment, orderApproved };
  }

  async listManualPayments(limit = 50) {
    return this.dataSource.query(
      `SELECT pm.*, a.email AS admin_email
       FROM payments_manual pm
       LEFT JOIN users a ON a.id = pm.registered_by
       ORDER BY pm.created_at DESC
       LIMIT $1`,
      [limit],
    );
  }

  /**
   * RF: carga de archivo TXT bancario para contraste con estados de cuenta.
   * Acepta líneas con fecha dd/mm/yyyy, referencia numérica y monto; separa por ; tab o espacios dobles.
   */
  parseTxt(content: string): Array<{ movement_date: string | null; reference: string | null; description: string | null; amount: number | null; raw_line: string }> {
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const out: Array<{ movement_date: string | null; reference: string | null; description: string | null; amount: number | null; raw_line: string }> = [];
    for (const line of lines) {
      const tokens = line.split(/[;\t|]|\s{2,}/).map(t => t.trim()).filter(Boolean);
      const flat = tokens.length > 1 ? tokens : line.split(/\s+/);

      const dmyRe = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
      const isoRe = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      let dateIso: string | null = null;
      const isDateTok: boolean[] = flat.map(tok => {
        let m = tok.match(dmyRe);
        if (m) {
          if (!dateIso) {
            const y = m[3].length === 2 ? `20${m[3]}` : m[3];
            dateIso = `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
          }
          return true;
        }
        m = tok.match(isoRe);
        if (m) {
          if (!dateIso) dateIso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
          return true;
        }
        return false;
      });

      // Monto: último token tipo número con 2 decimales (acepta 1,234.56 y 1.234,56)
      let amount: number | null = null;
      let amountIdx = -1;
      for (let i = flat.length - 1; i >= 0; i--) {
        const clean = flat[i].replace(/USD|PEN|S\/|S\b/gi, "").trim();
        let m = clean.match(/^(-?[0-9,]+)\.([0-9]{2})$/);
        if (m && /^-?\d{1,3}(,\d{3})*$/.test(m[1])) { amount = parseFloat(`${m[1].replace(/,/g, "")}.${m[2]}`); amountIdx = i; break; }
        m = clean.match(/^(-?[0-9.]+),([0-9]{2})$/);
        if (m && /^-?\d{1,3}(\.\d{3})*$/.test(m[1])) { amount = parseFloat(`${m[1].replace(/\./g, "")}.${m[2]}`); amountIdx = i; break; }
        m = clean.match(/^-?\d+\.\d{2}$/);
        if (m) { amount = parseFloat(clean); amountIdx = i; break; }
      }
      if (amount == null) continue; // línea sin monto (encabezado u otra)

      // Referencia: la secuencia de dígitos más larga (>= 4), excluyendo la fecha y el monto
      let reference: string | null = null;
      for (let i = 0; i < flat.length; i++) {
        if (i === amountIdx || isDateTok[i]) continue;
        const digits = flat[i].replace(/[^0-9]/g, "");
        if (digits.length >= 4 && (!reference || digits.length > reference.length)) reference = digits;
      }

      const description = flat.filter((_, i) => i !== amountIdx).join(" ").slice(0, 300);
      out.push({ movement_date: dateIso, reference, description, amount, raw_line: line.slice(0, 500) });
    }
    return out;
  }

  async importBankTxt(adminId: string, content: string) {
    const parsed = this.parseTxt(content);
    if (!parsed.length) throw new BadRequestException("No se detectaron movimientos válidos en el archivo (se requiere fecha, referencia y monto)");
    const batchId = randomUUID();
    for (const mv of parsed) {
      await this.dataSource.query(
        `INSERT INTO bank_movements (batch_id, movement_date, reference, description, amount, raw_line)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [batchId, mv.movement_date, mv.reference, mv.description, mv.amount, mv.raw_line],
      );
    }
    const stats = await this.runMatching(batchId);
    this.audit.log({ userId: adminId, action: "bank_txt_imported", entity: "conciliation", entityId: batchId, details: { movimientos: parsed.length, ...stats } });
    return { message: `${parsed.length} movimiento(s) importado(s)`, batch_id: batchId, ...stats };
  }

  /** Conciliación bancaria: contrasta movimientos del banco contra pagos registrados en la plataforma. */
  async runMatching(batchId?: string) {
    const filter = batchId ? `WHERE batch_id = $1 AND match_status = 'pendiente'` : `WHERE match_status = 'pendiente'`;
    const params = batchId ? [batchId] : [];
    const movements = await this.dataSource.query(`SELECT id, movement_date, reference, amount FROM bank_movements ${filter}`, params);
    let conciliados = 0;
    for (const mv of movements) {
      const ref = mv.reference ? String(mv.reference).replace(/^0+/, "") : null;

      // 1) Coincidencia por número de operación contra pedidos
      let matched: any = null;
      if (ref) {
        [matched] = await this.dataSource.query(
          `SELECT id FROM orders WHERE operation_number ILIKE '%' || $1 || '%'
             AND ABS(COALESCE(amount, total_amount) - $2) < 0.01 LIMIT 1`,
          [ref, mv.amount],
        );
      }
      // 2) Respaldo: mismo monto en una ventana de ±3 días
      if (!matched && mv.movement_date) {
        [matched] = await this.dataSource.query(
          `SELECT id FROM orders
           WHERE ABS(COALESCE(amount, total_amount) - $1) < 0.01
             AND created_at::date BETWEEN ($2::date - INTERVAL '3 days') AND ($2::date + INTERVAL '3 days')
           ORDER BY created_at DESC LIMIT 1`,
          [mv.amount, mv.movement_date],
        );
      }
      // 3) Pagos manuales registrados por admin
      if (!matched && ref) {
        [matched] = await this.dataSource.query(
          `SELECT id FROM payments_manual WHERE operation_number ILIKE '%' || $1 || '%' AND ABS(amount - $2) < 0.01 LIMIT 1`,
          [ref, mv.amount],
        );
      }

      if (matched) {
        const isManual = matched.id && (await this.dataSource.query(`SELECT 1 FROM payments_manual WHERE id = $1`, [matched.id])).length > 0;
        await this.dataSource.query(
          `UPDATE bank_movements SET match_status = 'conciliado', matched_order_id = $2, matched_payment_id = $3 WHERE id = $1`,
          [mv.id, isManual ? null : matched.id, isManual ? matched.id : null],
        );
        conciliados++;
      }
    }
    const [tot] = await this.dataSource.query(
      `SELECT COUNT(*)::int AS total,
              SUM(CASE WHEN match_status = 'conciliado' THEN 1 ELSE 0 END)::int AS conciliados,
              SUM(CASE WHEN match_status = 'pendiente' THEN 1 ELSE 0 END)::int AS pendientes
       FROM bank_movements ${batchId ? "WHERE batch_id = $1" : ""}`,
      params,
    );
    return tot;
  }

  async getReport(batchId?: string) {
    const movements = await this.dataSource.query(
      `SELECT bm.*, o.order_number, o.operation_number AS order_operation
       FROM bank_movements bm
       LEFT JOIN orders o ON o.id = bm.matched_order_id
       ${batchId ? "WHERE bm.batch_id = $1" : ""}
       ORDER BY bm.created_at DESC, bm.movement_date DESC NULLS LAST
       LIMIT 200`,
      batchId ? [batchId] : [],
    );
    const stats = await this.runMatching(batchId);
    // Pagos de plataforma sin movimiento bancario que los respalde
    const sinRespaldo = await this.dataSource.query(
      `SELECT o.id, o.order_number, o.operation_number, o.amount, o.total_amount, o.status, o.created_at
       FROM orders o
       WHERE o.status IN ('pending_payment', 'paid')
         AND NOT EXISTS (
           SELECT 1 FROM bank_movements bm
           WHERE bm.match_status = 'conciliado' AND bm.matched_order_id = o.id
         )
       ORDER BY o.created_at DESC LIMIT 100`,
    );
    return { movements, stats, pagos_sin_respaldo: sinRespaldo };
  }
}
