import { Controller, Post, Param, Get, NotFoundException, BadRequestException, UseGuards } from "@nestjs/common";
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
  async findAll() {
    return this.dataSource.query(
      `SELECT * FROM auctions WHERE estado = 'activo' ORDER BY fecha_fin ASC`
    );
  }

  @Get("ended")
  @RequirePermission("auctions.manage")
  async findEnded() {
    return this.dataSource.query(
      `SELECT * FROM auctions WHERE estado = 'cerrado' ORDER BY updated_at DESC`
    );
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

      // Create remaining balance order
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
