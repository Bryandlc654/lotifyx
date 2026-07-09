import { Controller, Post, HttpCode, HttpStatus } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("auctions/sync")
export class AuctionsSyncController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async sync() {
    const result = await this.dataSource.query(
      `UPDATE auctions a
       SET fecha_fin = p.cierre_estimado
       FROM products p
       WHERE p.id = a.product_id
         AND a.estado = 'activo'
         AND p.cierre_estimado IS NOT NULL
         AND a.fecha_fin != p.cierre_estimado
       RETURNING a.id, a.product_id, a.fecha_fin`
    );
    return { message: `Sincronizadas ${result.length} subastas`, data: result };
  }
}
