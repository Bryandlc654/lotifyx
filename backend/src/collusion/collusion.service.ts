import { Injectable } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "../config/config.service";

export interface SignalInput {
  eventType: "subasta" | "solicitud";
  eventId: string;
  userId: string;
  amount: number;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class CollusionService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /** Registra la señal (IP + monto) de una puja u oferta y dispara las reglas de colusión. */
  async recordSignal(input: SignalInput) {
    try {
      await this.dataSource.query(
        `INSERT INTO event_signals (event_type, event_id, user_id, ip, user_agent, amount)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [input.eventType, input.eventId, input.userId, input.ip || null, input.userAgent || null, input.amount],
      );
      await this.detectForEvent(input);
    } catch (e: any) {
      console.error("[Collusion] Error registrando señal:", e.message);
    }
  }

  /** Reglas que se evalúan sobre las señales del mismo evento (puja u oferta). */
  private async detectForEvent(input: SignalInput) {
    const rows: any[] = await this.dataSource.query(
      `SELECT es.user_id, es.ip, es.user_agent, es.amount, u.email
       FROM event_signals es
       JOIN users u ON u.id = es.user_id
       WHERE es.event_type = $1 AND es.event_id = $2
       ORDER BY es.created_at ASC`,
      [input.eventType, input.eventId],
    );

    if (rows.length < 2) return;

    // Regla 1: montos idénticos entre actores distintos (señal típica de coordinación)
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const a = rows[i];
        const b = rows[j];
        if (a.user_id === b.user_id) continue;
        if (Number(a.amount) === Number(b.amount)) {
          await this.flag({
            eventType: input.eventType,
            eventId: input.eventId,
            rule: "precio_identico",
            severity: "media",
            userEmails: [a.email, b.email],
            detail: { monto: Number(a.amount) },
          });
        }
      }
    }

    // Regla 2: misma IP entre actores distintos (misma red → posible concertación)
    const byIp = new Map<string, any[]>();
    for (const r of rows) {
      if (!r.ip) continue;
      if (!byIp.has(r.ip)) byIp.set(r.ip, []);
      byIp.get(r.ip)!.push(r);
    }
    for (const [ip, group] of byIp) {
      const unique = new Map<string, any>();
      for (const r of group) unique.set(r.user_id, r);
      if (unique.size >= 2) {
        const users = [...unique.values()];
        await this.flag({
          eventType: input.eventType,
          eventId: input.eventId,
          rule: "misma_ip",
          severity: "alta",
          userEmails: users.map((u) => u.email),
          detail: { ip, cantidad: users.length },
        });
      }
    }

    // Regla 3: mismo User-Agent entre actores distintos (mismo dispositivo/equipo)
    const byUa = new Map<string, any[]>();
    for (const r of rows) {
      if (!r.user_agent) continue;
      if (!byUa.has(r.user_agent)) byUa.set(r.user_agent, []);
      byUa.get(r.user_agent)!.push(r);
    }
    for (const [ua, group] of byUa) {
      const unique = new Map<string, any>();
      for (const r of group) unique.set(r.user_id, r);
      if (unique.size >= 2) {
        const users = [...unique.values()];
        await this.flag({
          eventType: input.eventType,
          eventId: input.eventId,
          rule: "mismo_dispositivo",
          severity: "media",
          userEmails: users.map((u) => u.email),
          detail: { user_agent: ua.slice(0, 120) },
        });
      }
    }
  }

  /** Historial de comportamiento: pares de actores que repiten montos cercanos o un comprador que siempre acepta al mismo vendedor. */
  async detectHistory() {
    try {
      // 3a. Dos vendedores que ofertan montos idénticos en varias solicitudes distintas
      const ofertasIdenticas = await this.dataSource.query(
        `SELECT ro.seller_id, ro2.seller_id AS seller2_id, COUNT(*)::int AS veces
         FROM request_offers ro
         JOIN request_offers ro2 ON ro2.request_id = ro.request_id AND ro2.seller_id > ro.seller_id
         WHERE ro.precio = ro2.precio AND ro.costo_envio = ro2.costo_envio
         GROUP BY ro.seller_id, ro2.seller_id
         HAVING COUNT(*) >= 2`,
      );
      for (const r of ofertasIdenticas) {
        const [a] = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [r.seller_id]);
        const [b] = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [r.seller2_id]);
        await this.flag({
          eventType: "solicitud",
          eventId: null,
          rule: "historial_ofertas_identicas",
          severity: "alta",
          userEmails: [a?.email, b?.email],
          detail: { veces: r.veces },
        });
      }

      // 3b. Comprador que acepta ofertas del mismo vendedor repetidamente
      const compradorRepetido = await this.dataSource.query(
        `SELECT br.user_id AS buyer_id, ro.seller_id, COUNT(*)::int AS veces
         FROM request_offers ro
         JOIN buyer_requests br ON br.id = ro.request_id
         WHERE ro.estado = 'aceptada'
         GROUP BY br.user_id, ro.seller_id
         HAVING COUNT(*) >= 3`,
      );
      for (const r of compradorRepetido) {
        const [buyer] = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [r.buyer_id]);
        const [seller] = await this.dataSource.query(`SELECT email FROM users WHERE id = $1`, [r.seller_id]);
        await this.flag({
          eventType: "solicitud",
          eventId: null,
          rule: "comprador_mismo_vendedor",
          severity: "baja",
          userEmails: [buyer?.email, seller?.email],
          detail: { veces: r.veces },
        });
      }
    } catch (e: any) {
      console.error("[Collusion] Error en historial:", e.message);
    }
  }

  private async flag(opts: {
    eventType: string;
    eventId: string | null;
    rule: string;
    severity: string;
    userEmails: string[];
    detail: Record<string, any>;
  }) {
    const ids = await this.dataSource.query(
      `SELECT id FROM users WHERE email = ANY($1)`,
      [opts.userEmails],
    );
    const userIds = ids.map((r: any) => r.id);
    if (userIds.length < 2) return;

    // Evitar duplicar la misma alerta en el mismo evento+regla+usuarios
    const [dup] = await this.dataSource.query(
      `SELECT 1 FROM collusion_flags
       WHERE rule = $1 AND event_id IS NOT DISTINCT FROM $2 AND user_ids = $3
       LIMIT 1`,
      [opts.rule, opts.eventId, userIds],
    );
    if (dup) return;

    await this.dataSource.query(
      `INSERT INTO collusion_flags (event_type, event_id, rule, severity, user_ids, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [opts.eventType, opts.eventId, opts.rule, opts.severity, userIds, opts.detail],
    );

    // Auto-marcado de cuentas sospechosas (no bloquea ventas, solo señala para revisión)
    for (const uid of userIds) {
      await this.maybeFlagUser(uid);
    }
  }

  /** Marca a un usuario como sospechoso si acumula suficientes alertas de colusión. */
  private async maybeFlagUser(userId: string) {
    try {
      const [agg] = await this.dataSource.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE severity = 'alta')::int AS altas
         FROM collusion_flags WHERE $1 = ANY(user_ids) AND status = 'abierto'`,
        [userId],
      );
      const total = agg?.total || 0;
      const altas = agg?.altas || 0;
      // Umbral: 2 alertas de severidad alta o 4 alertas en total
      if (total >= 4 || altas >= 2) {
        await this.dataSource.query(
          `UPDATE users SET collusion_flagged = true, collusion_note = COALESCE(
             collusion_note || '', '') WHERE id = $1`,
          [userId],
        );
      }
    } catch (e: any) {
      console.error("[Collusion] Error marcando usuario:", e.message);
    }
  }

  /** Bloquea una acción (pujar/ofertar) si la cuenta está marcada como sospechosa. */
  async assertNotBlocked(userId: string) {
    const [u] = await this.dataSource.query(
      `SELECT collusion_flagged FROM users WHERE id = $1`,
      [userId],
    );
    if (u?.collusion_flagged) {
      throw new ForbiddenException(
        "Tu cuenta está bajo revisión por actividad sospechosa. Contacta al soporte de LOTIFYX.",
      );
    }
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async detectHistoryCron() {
    await this.detectHistory();
  }

  async listFlags(status?: string) {    const where = status ? `WHERE status = $1` : "";
    const params = status ? [status] : [];
    const rows = await this.dataSource.query(
      `SELECT cf.*,
         COALESCE((
           SELECT json_agg(json_build_object('id', u.id, 'email', u.email))
           FROM users u WHERE u.id = ANY(cf.user_ids)
         ), '[]') AS users
       FROM collusion_flags cf
       ${where}
       ORDER BY cf.created_at DESC
       LIMIT 200`,
      params,
    );
    return rows;
  }

  async resolveFlag(id: string) {
    await this.dataSource.query(
      `UPDATE collusion_flags SET status = 'resuelto' WHERE id = $1`,
      [id],
    );
    return { message: "Alerta de colusión resuelta" };
  }

  async listFlaggedUsers() {
    const rows = await this.dataSource.query(
      `SELECT u.id, u.email, u.collusion_flagged, u.collusion_note,
              (SELECT COUNT(*)::int FROM collusion_flags cf
               WHERE u.id = ANY(cf.user_ids) AND cf.status = 'abierto') AS alertas_abiertas,
              up.first_name, up.last_name
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.collusion_flagged = true
       ORDER BY u.updated_at DESC`,
    );
    return rows;
  }

  async clearUserFlag(userId: string) {
    await this.dataSource.query(
      `UPDATE users SET collusion_flagged = false, collusion_note = NULL WHERE id = $1`,
      [userId],
    );
    return { message: "Cuenta desmarcada de sospecha de colusión" };
  }

  /** Registra un incumplimiento de pago y sanciona si se supera el umbral configurado. */
  async registerIncumplimiento(userId: string) {
    const maxInc = await this.config.getNum("max_incumplimientos");
    const sancionDias = await this.config.getNum("sancion_dias");
    await this.dataSource.query(
      `UPDATE users SET incumplimientos_count = incumplimientos_count + 1 WHERE id = $1`,
      [userId],
    );
    const [u] = await this.dataSource.query(
      `SELECT incumplimientos_count FROM users WHERE id = $1`,
      [userId],
    );
    if (Number(u?.incumplimientos_count || 0) >= maxInc) {
      await this.dataSource.query(
        `UPDATE users SET sancionado = true, sancion_hasta = NOW() + ($1::int * INTERVAL '1 day') WHERE id = $2`,
        [sancionDias, userId],
      );
      return { sancionado: true, sancion_dias: sancionDias, incumplimientos: u.incumplimientos_count };
    }
    return { sancionado: false, incumplimientos: u.incumplimientos_count };
  }

  /** Bloquea pujar/ofertar si el usuario está sancionado por incumplimiento de pago vigente. */
  async assertNotSanctioned(userId: string) {
    const [u] = await this.dataSource.query(
      `SELECT sancionado, sancion_hasta FROM users WHERE id = $1`,
      [userId],
    );
    if (u?.sancionado) {
      const hasta = u.sancion_hasta ? new Date(u.sancion_hasta) : null;
      if (!hasta || hasta > new Date()) {
        const fecha = hasta ? hasta.toISOString().slice(0, 10) : "por tiempo indefinido";
        throw new ForbiddenException(
          `Tu cuenta está suspendida por incumplimiento de pago hasta el ${fecha}. Contacta al soporte de LOTIFYX.`,
        );
      }
      await this.dataSource.query(
        `UPDATE users SET sancionado = false, sancion_hasta = NULL WHERE id = $1`,
        [userId],
      );
    }
  }

  async listSanctioned() {
    const rows = await this.dataSource.query(
      `SELECT u.id, u.email, u.incumplimientos_count, u.sancionado, u.sancion_hasta,
              up.first_name, up.last_name
       FROM users u
       LEFT JOIN user_profiles up ON up.user_id = u.id
       WHERE u.sancionado = true OR u.incumplimientos_count > 0
       ORDER BY u.updated_at DESC`,
    );
    return rows;
  }

  async clearSanction(userId: string) {
    await this.dataSource.query(
      `UPDATE users SET sancionado = false, sancion_hasta = NULL, incumplimientos_count = 0 WHERE id = $1`,
      [userId],
    );
    return { message: "Sanción e incumplimientos eliminados" };
  }
}
