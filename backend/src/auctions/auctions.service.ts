import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Auction } from "./auction.entity";
import { AuctionBid } from "./auction-bid.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { MessagesGateway } from "../messages/messages.gateway";

@Injectable()
export class AuctionsService implements OnModuleInit {

  async onModuleInit() {
    try {
      const closed = await this.closeExpired();
      if (closed > 0) {
        console.log(`[Auction] ${closed} subasta(s) vencida(s) cerrada(s) al iniciar`);
      }
    } catch (e: any) {
      console.error("[Auction] Error en onModuleInit:", e.message);
    }
  }
  constructor(
    @InjectRepository(Auction)
    private readonly repo: Repository<Auction>,
    @InjectRepository(AuctionBid)
    private readonly bidsRepo: Repository<AuctionBid>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly gateway: MessagesGateway,
  ) {}

  /** Cierra la subasta on-demand si ya expiró pero sigue activa */
  private async closeIfExpired(auction: Auction) {
    if (auction.estado === "activo" && new Date() > new Date(auction.fecha_fin)) {
      await this.closeSingle(auction.id);
      return true;
    }
    return false;
  }

  async findByProduct(productId: string) {
    let auction = await this.repo.findOne({ where: { product_id: productId } });
    if (!auction) return null;

    // Cierre en tiempo real si expiró
    const wasClosed = await this.closeIfExpired(auction);
    if (wasClosed) {
      const updated = await this.repo.findOne({ where: { id: auction.id } });
      if (updated) auction = updated;
    }

    const confirmedBidsCount = await this.bidsRepo.count({ where: { auction_id: auction.id, estado: "confirmada" } });
    const highestConfirmed = await this.bidsRepo.findOne({
      where: { auction_id: auction.id, estado: "confirmada" },
      order: { monto: "DESC" },
    });
    const precioActual = highestConfirmed?.monto || auction.precio_inicial;
    let remaining_order_id = null;
    try {
      const [extras] = await this.dataSource.query(
        `SELECT remaining_order_id FROM auctions WHERE id = $1`, [auction.id]
      );
      remaining_order_id = extras?.remaining_order_id || null;
    } catch {}
    return { ...auction, remaining_order_id, bid_count: confirmedBidsCount, highest_bid: highestConfirmed?.monto || null, precio_actual: Number(precioActual) };
  }

  async findActive() {
    return this.repo.find({
      where: { estado: "activo" },
      order: { fecha_fin: "ASC" },
      take: 100,
    });
  }

  async findEnded() {
    return this.repo.find({
      where: { estado: "cerrado" },
      order: { updated_at: "DESC" },
      take: 100,
    });
  }

  async create(dto: {
    product_id: string;
    vendedor_id: string;
    precio_inicial: number;
    incremento_minimo?: number;
    precio_reserva?: number;
    fecha_fin: string;
  }) {
    const existing = await this.repo.findOne({ where: { product_id: dto.product_id } });
    if (existing) throw new BadRequestException("Este producto ya tiene una subasta activa");

    return this.repo.save(this.repo.create({
      product_id: dto.product_id,
      vendedor_id: dto.vendedor_id,
      precio_inicial: dto.precio_inicial,
      precio_actual: dto.precio_inicial,
      incremento_minimo: dto.incremento_minimo || 1,
      precio_reserva: dto.precio_reserva,
      fecha_inicio: new Date(),
      fecha_fin: new Date(dto.fecha_fin),
      estado: "activo",
    }));
  }

  async placeBid(auctionId: string, postorId: string, monto: number) {
    let auction = await this.repo.findOne({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException("Subasta no encontrada");

    // Cierre en tiempo real si expiró
    const wasClosed = await this.closeIfExpired(auction);
    if (wasClosed) {
      auction = await this.repo.findOne({ where: { id: auctionId } });
      throw new BadRequestException("La subasta ya terminó");
    }

    if (auction.estado !== "activo") throw new BadRequestException("La subasta no está activa");
    if (auction.vendedor_id === postorId) throw new ForbiddenException("No puedes pujar en tu propia subasta");
    if (new Date() > new Date(auction.fecha_fin)) throw new BadRequestException("La subasta ya terminó");

    // Check against confirmed bids only
    const highestConfirmed = await this.bidsRepo.findOne({
      where: { auction_id: auctionId, estado: "confirmada" },
      order: { monto: "DESC" },
    });
    const precioActual = highestConfirmed?.monto || auction.precio_inicial;
    if (monto < Number(precioActual) + Number(auction.incremento_minimo)) {
      throw new BadRequestException(`La puja debe ser al menos S/ ${(Number(precioActual) + Number(auction.incremento_minimo)).toFixed(2)}`);
    }

    const bid = await this.bidsRepo.save(this.bidsRepo.create({
      auction_id: auctionId,
      postor_id: postorId,
      monto,
      estado: "pendiente",
    }));

    auction.precio_actual = monto;
    await this.repo.save(auction);

    // Do NOT emit WebSocket - bid is pending payment
    return bid;
  }

  async confirmBid(bidId: string) {
    const bid = await this.bidsRepo.findOne({ where: { id: bidId } });
    if (!bid) throw new NotFoundException("Puja no encontrada");
    if (bid.estado !== "pendiente") throw new BadRequestException("La puja ya fue procesada");

    bid.estado = "confirmada";
    await this.bidsRepo.save(bid);

    const auction = await this.repo.findOne({ where: { id: bid.auction_id } });
    if (!auction) throw new NotFoundException("Subasta no encontrada");

    // Si con esta puja la subasta alcanzó su fin, cerrar en tiempo real
    if (new Date() > new Date(auction.fecha_fin) && auction.estado === "activo") {
      await this.closeSingle(auction.id);
      return { message: "Puja confirmada. Subasta cerrada." };
    }

    const bidCount = await this.bidsRepo.count({ where: { auction_id: bid.auction_id, estado: "confirmada" } });
    const highestConfirmed = await this.bidsRepo.findOne({
      where: { auction_id: bid.auction_id, estado: "confirmada" },
      order: { monto: "DESC" },
    });

    auction.precio_actual = highestConfirmed?.monto || auction.precio_inicial;
    await this.repo.save(auction);

    this.gateway.notifyNewBid(auction.product_id, {
      precio_actual: auction.precio_actual,
      bid_count: bidCount,
      highest_bid: highestConfirmed?.monto || auction.precio_inicial,
    });

    return { message: "Puja confirmada" };
  }

  async getBids(auctionId: string) {
    return this.bidsRepo.find({
      where: { auction_id: auctionId },
      order: { monto: "DESC" },
      take: 50,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async closeExpired() {
    let closed = 0;
    let page = 0;
    const BATCH = 50;
    let batch: Auction[];
    do {
      batch = await this.repo.find({
        where: { estado: "activo", fecha_fin: LessThan(new Date()) },
        order: { fecha_fin: "ASC" },
        take: BATCH,
        skip: page * BATCH,
      });
      for (const auction of batch) {
        try {
          await this.closeSingle(auction.id);
          closed++;
        } catch (e: any) {
          console.error(`[Auction] Error cerrando subasta ${auction.id.slice(0,8)}:`, e.message);
        }
      }
      page++;
    } while (batch.length === BATCH);
    if (closed > 0) {
      console.log(`[Auction] ${closed} subasta(s) cerrada(s) automáticamente`);
    }
    return closed;
  }

  async closeSingle(auctionId: string) {
    const auction = await this.repo.findOne({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException("Subasta no encontrada");
    if (auction.estado !== "activo") throw new BadRequestException("La subasta no está activa");

    const highestBid = await this.bidsRepo.findOne({
      where: { auction_id: auctionId, estado: "confirmada" },
      order: { monto: "DESC" },
    });

    auction.estado = "cerrado";
    auction.ganador_id = highestBid?.postor_id || null;
    await this.repo.save(auction);

    // Mark confirmed non-winner bids as "perdida"
    if (highestBid) {
      await this.dataSource.query(
        `UPDATE auction_bids SET estado = 'perdida'
         WHERE auction_id = $1 AND id != $2 AND estado = 'confirmada'`,
        [auction.id, highestBid.id],
      );

      // Create remaining balance order for winner
      try {
        const [winnerBid] = await this.dataSource.query(
          `SELECT ab.monto, ab.checkout_id, o.amount AS guarantee_paid
           FROM auction_bids ab
           LEFT JOIN orders o ON o.id = ab.checkout_id
           WHERE ab.id = $1`,
          [highestBid.id],
        );
        if (winnerBid && winnerBid.checkout_id && Number(winnerBid.guarantee_paid || 0) < Number(winnerBid.monto)) {
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
            [remainingOrder.id, auction.id],
          );
          console.log(`[Auction] Remaining balance order ${remainingOrder.id.slice(0,8)} (S/ ${remaining.toFixed(2)}) created for winner ${highestBid.postor_id.slice(0,8)}`);
        }
      } catch (e: any) {
        console.error(`[Auction] Error creating remaining order:`, e.message);
      }
    }

    // Emit WebSocket notification
    const bidCount = await this.bidsRepo.count({
      where: { auction_id: auction.id, estado: "confirmada" },
    });
    this.gateway.notifyNewBid(auction.product_id, {
      precio_actual: auction.precio_actual,
      bid_count: bidCount,
      highest_bid: highestBid?.monto || auction.precio_inicial,
      estado: "cerrado",
      ganador_id: auction.ganador_id,
    });

    return auction;
  }
}
