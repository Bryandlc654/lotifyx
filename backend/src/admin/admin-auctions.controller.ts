import { Controller, Post, Param, Get, Query, NotFoundException, BadRequestException, UseGuards } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/auctions")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminAuctionsController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @RequirePermission("auctions.manage")
  async findAll(@Query("page") page?: number, @Query("limit") limit?: number) {
    const p = page || 1;
    const l = Math.min(limit || 50, 100);
    const offset = (p - 1) * l;

    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM auctions`
    );

    const rows = await this.dataSource.query(
      `SELECT a.*, p.title AS product_title, p.sku AS product_sku,
              p.user_id AS seller_id,
              seller_profile.first_name AS seller_name,
              COALESCE(bid_stats.total_bids, 0)::int AS total_bids,
              COALESCE(bid_stats.confirmed_bids, 0)::int AS confirmed_bids,
              COALESCE(bid_stats.highest_bid, 0)::numeric AS highest_bid_amount,
              winner_profile.first_name AS winner_name,
              winner_profile.last_name AS winner_last_name
       FROM auctions a
       LEFT JOIN products p ON p.id = a.product_id
       LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = p.user_id
       LEFT JOIN user_profiles winner_profile ON winner_profile.user_id = a.ganador_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total_bids,
           COUNT(*) FILTER (WHERE estado = 'confirmada')::int AS confirmed_bids,
           MAX(monto) FILTER (WHERE estado = 'confirmada')::numeric AS highest_bid
         FROM auction_bids ab
         WHERE ab.auction_id = a.id
       ) bid_stats ON true
       ORDER BY a.estado ASC, a.fecha_fin ASC
       LIMIT $1 OFFSET $2`,
      [l, offset],
    );

    return { data: rows, total: Number(count), page: p, totalPages: Math.ceil(Number(count) / l) };
  }

  @Get(":id/bids")
  @RequirePermission("auctions.manage")
  async getBids(@Param("id") id: string) {
    const [auction] = await this.dataSource.query(
      `SELECT a.*, p.title AS product_title FROM auctions a
       LEFT JOIN products p ON p.id = a.product_id
       WHERE a.id = $1`, [id]
    );
    if (!auction) throw new NotFoundException("Subasta no encontrada");

    const bids = await this.dataSource.query(
      `SELECT ab.*, up.first_name, up.last_name, u.email,
              o.status AS order_status, o.total_amount AS order_total
       FROM auction_bids ab
       LEFT JOIN users u ON u.id = ab.postor_id
       LEFT JOIN user_profiles up ON up.user_id = ab.postor_id
       LEFT JOIN orders o ON o.id = ab.checkout_id
       WHERE ab.auction_id = $1
       ORDER BY ab.monto DESC`,
      [id],
    );

    return { auction, bids };
  }

  @Get("ended")
  @RequirePermission("auctions.manage")
  async findEnded(@Query("page") page?: number, @Query("limit") limit?: number) {
    const p = page || 1;
    const l = Math.min(limit || 50, 100);
    const offset = (p - 1) * l;

    const [{ count }] = await this.dataSource.query(
      `SELECT COUNT(*)::int FROM auctions WHERE estado = 'cerrado'`
    );

    const rows = await this.dataSource.query(
      `SELECT a.*, p.title AS product_title, p.sku AS product_sku,
              p.user_id AS seller_id,
              seller_profile.first_name AS seller_name,
              COALESCE(bid_stats.total_bids, 0)::int AS total_bids,
              COALESCE(bid_stats.confirmed_bids, 0)::int AS confirmed_bids,
              COALESCE(bid_stats.highest_bid, 0)::numeric AS highest_bid_amount,
              winner_profile.first_name AS winner_name,
              winner_profile.last_name AS winner_last_name,
              ro.status AS remaining_order_status,
              ro.total_amount AS remaining_amount
       FROM auctions a
       LEFT JOIN products p ON p.id = a.product_id
       LEFT JOIN user_profiles seller_profile ON seller_profile.user_id = p.user_id
       LEFT JOIN user_profiles winner_profile ON winner_profile.user_id = a.ganador_id
       LEFT JOIN orders ro ON ro.id = a.remaining_order_id
       LEFT JOIN LATERAL (
         SELECT
           COUNT(*)::int AS total_bids,
           COUNT(*) FILTER (WHERE estado = 'confirmada')::int AS confirmed_bids,
           MAX(monto) FILTER (WHERE estado = 'confirmada')::numeric AS highest_bid
         FROM auction_bids ab
         WHERE ab.auction_id = a.id
       ) bid_stats ON true
       WHERE a.estado = 'cerrado'
       ORDER BY a.updated_at DESC
       LIMIT $1 OFFSET $2`,
      [l, offset],
    );

    return { data: rows, total: Number(count), page: p, totalPages: Math.ceil(Number(count) / l) };
  }

  @Post(":id/close")
  @RequirePermission("auctions.manage")
  async close(@Param("id") id: string) {
    const [auction] = await this.dataSource.query(
      `SELECT * FROM auctions WHERE id = $1`, [id]
    );
    if (!auction) throw new NotFoundException("Subasta no encontrada");
    if (auction.estado !== "activo") throw new BadRequestException("La subasta no está activa");

    const [highestBid] = await this.dataSource.query(
      `SELECT * FROM auction_bids WHERE auction_id = $1 AND estado = 'confirmada' ORDER BY monto DESC LIMIT 1`,
      [id],
    );

    await this.dataSource.query(
      `UPDATE auctions SET estado = 'cerrado', ganador_id = $2, updated_at = NOW() WHERE id = $1`,
      [id, highestBid?.postor_id || null],
    );

    if (highestBid) {
      await this.dataSource.query(
        `UPDATE auction_bids SET estado = 'perdida' WHERE auction_id = $1 AND id != $2 AND estado = 'confirmada'`,
        [id, highestBid.id],
      );

      const [winnerBid] = await this.dataSource.query(
        `SELECT ab.monto, ab.checkout_id, o.amount AS guarantee_paid
         FROM auction_bids ab
         LEFT JOIN orders o ON o.id = ab.checkout_id
         WHERE ab.id = $1`,
        [highestBid.id],
      );
      if (winnerBid?.checkout_id && Number(winnerBid.guarantee_paid || 0) < Number(winnerBid.monto)) {
        const remaining = Number(winnerBid.monto) - Number(winnerBid.guarantee_paid || 0);
        const [remainingOrder] = await this.dataSource.query(
          `INSERT INTO orders (user_id, total_amount, status, created_at, updated_at)
           VALUES ($1, $2, 'pending_payment', NOW(), NOW())
           RETURNING *`,
          [highestBid.postor_id, remaining],
        );
        await this.dataSource.query(
          `INSERT INTO order_items (order_id, product_id, price, created_at)
           VALUES ($1, $2, $3, NOW())`,
          [remainingOrder.id, auction.product_id, remaining],
        );
        await this.dataSource.query(
          `UPDATE auctions SET remaining_order_id = $1 WHERE id = $2`,
          [remainingOrder.id, id],
        );
      }
    }

    return { message: "Subasta cerrada correctamente" };
  }
}
