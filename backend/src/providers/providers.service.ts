import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class ProvidersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Obtiene o crea el perfil de prestador (zonas + disponibilidad). */
  async getOrCreateProvider(userId: string) {
    const [row] = await this.dataSource.query(
      `SELECT * FROM service_providers WHERE user_id = $1`, [userId],
    );
    if (row) return row;
    const [created] = await this.dataSource.query(
      `INSERT INTO service_providers (user_id, zonas_atencion, disponibilidad)
       VALUES ($1, '[]', '{}') RETURNING *`, [userId],
    );
    return created;
  }

  /** Define zonas de atención geográficas del prestador. */
  async setZonas(userId: string, zonas: string[]) {
    await this.getOrCreateProvider(userId);
    const cleaned = (Array.isArray(zonas) ? zonas : []).filter(Boolean).map(String);
    const [row] = await this.dataSource.query(
      `UPDATE service_providers SET zonas_atencion = $2, updated_at = NOW()
       WHERE user_id = $1 RETURNING *`, [userId, cleaned],
    );
    return row;
  }

  /** Registra la disponibilidad horaria del prestador. */
  async setDisponibilidad(userId: string, disponibilidad: Record<string, any>) {
    await this.getOrCreateProvider(userId);
    const [row] = await this.dataSource.query(
      `UPDATE service_providers SET disponibilidad = $2, updated_at = NOW()
       WHERE user_id = $1 RETURNING *`, [userId, disponibilidad || {}],
    );
    return row;
  }

  /** Perfil público del prestador (zonas + disponibilidad + portafolio). */
  async getProviderPublic(userId: string) {
    const [row] = await this.dataSource.query(
      `SELECT sp.zonas_atencion, sp.disponibilidad, u.email,
              up.first_name, up.last_name, up.avatar_url
       FROM service_providers sp
       LEFT JOIN users u ON u.id = sp.user_id
       LEFT JOIN user_profiles up ON up.user_id = sp.user_id
       WHERE sp.user_id = $1`, [userId],
    );
    if (!row) throw new NotFoundException("Prestador no encontrado");
    const jobs = await this.dataSource.query(
      `SELECT id, title, descripcion, fotos, created_at FROM service_jobs
       WHERE provider_id = $1 ORDER BY created_at DESC`, [userId],
    );
    return { ...row, portafolio: jobs };
  }

  /** Agrega un trabajo completado al portafolio del prestador. */
  async addJob(userId: string, dto: { title?: string; descripcion?: string; fotos?: string[]; product_id?: string }) {
    const title = String(dto?.title || "").trim();
    if (!title) throw new NotFoundException("El título del trabajo es obligatorio");
    const fotos = (Array.isArray(dto?.fotos) ? dto.fotos : []).filter(Boolean);
    const [job] = await this.dataSource.query(
      `INSERT INTO service_jobs (provider_id, product_id, title, descripcion, fotos)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, dto?.product_id || null, title, dto?.descripcion || null, fotos],
    );
    return job;
  }

  async deleteJob(jobId: string, userId: string) {
    await this.dataSource.query(
      `DELETE FROM service_jobs WHERE id = $1 AND provider_id = $2`, [jobId, userId],
    );
    return { message: "Trabajo eliminado" };
  }
}
