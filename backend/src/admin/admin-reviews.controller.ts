import { Controller, Get, Delete, Param, Query, NotFoundException, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("admin/reviews")
export class AdminReviewsController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  async getAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    const p = page || 1;
    const l = limit || 20;
    const offset = (p - 1) * l;
    const [{ count }] = await this.dataSource.query(`SELECT COUNT(*)::int FROM reviews`);
    const rows = await this.dataSource.query(
      `SELECT r.*, p.title as product_title, p.sku as product_sku,
              o.operation_number,
              u.email as user_email,
              up.first_name as user_first_name, up.last_name as user_last_name,
              seller.email as seller_email,
              seller_profile.first_name as seller_first_name,
              seller_profile.last_name as seller_last_name
       FROM reviews r
       LEFT JOIN products p ON p.id = r.product_id
       LEFT JOIN orders o ON o.id = r.order_id
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN user_profiles up ON up.user_id = r.user_id
       LEFT JOIN users seller ON seller.id = p.user_id
       LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = p.user_id
       ORDER BY r.created_at DESC
       LIMIT $1 OFFSET $2`,
      [l, offset],
    );
    return { data: rows, total: Number(count), page: p, totalPages: Math.ceil(Number(count) / l) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const [r] = await this.dataSource.query(`SELECT id FROM reviews WHERE id = $1`, [id]);
    if (!r) throw new NotFoundException("Reseña no encontrada");
    await this.dataSource.query(`DELETE FROM reviews WHERE id = $1`, [id]);
    return { message: "Reseña eliminada" };
  }
}
