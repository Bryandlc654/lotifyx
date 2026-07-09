import { Controller, Post, Param, HttpCode, HttpStatus, NotFoundException } from "@nestjs/common";
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

  @Post("reopen/:productId")
  @HttpCode(HttpStatus.OK)
  async reopen(@Param("productId") productId: string) {
    const [p] = await this.dataSource.query(
      `SELECT id, user_id, precio_inicial, precio_base, incremento_minimo, cierre_estimado, metodo_pago
       FROM products WHERE id = $1`, [productId]
    );
    if (!p) throw new NotFoundException("Producto no encontrado");
    if (p.metodo_pago !== "subasta") throw new NotFoundException("No es un producto de subasta");

    const precioInicial = Number(p.precio_inicial || p.precio_base || 0);
    if (precioInicial <= 0) throw new NotFoundException("Precio inicial no definido");

    // Eliminar auction anterior si existe
    await this.dataSource.query(`DELETE FROM auction_bids WHERE auction_id IN (SELECT id FROM auctions WHERE product_id = $1)`, [productId]);
    await this.dataSource.query(`DELETE FROM auctions WHERE product_id = $1`, [productId]);

    // Crear nueva subasta
    const [auction] = await this.dataSource.query(
      `INSERT INTO auctions (product_id, vendedor_id, precio_inicial, precio_actual, incremento_minimo, fecha_inicio, fecha_fin, estado)
       VALUES ($1, $2, $3, $3, $4, NOW(), $5, 'activo')
       RETURNING *`,
      [productId, p.user_id, precioInicial, p.incremento_minimo || 1,
       p.cierre_estimado ? new Date(p.cierre_estimado) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    return { message: "Subasta regenerada correctamente", auction };
  }
}
