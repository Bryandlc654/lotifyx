import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, MoreThan } from "typeorm";
import { Auction } from "./auction.entity";
import { AuctionBid } from "./auction-bid.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private readonly repo: Repository<Auction>,
    @InjectRepository(AuctionBid)
    private readonly bidsRepo: Repository<AuctionBid>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findByProduct(productId: string) {
    return this.repo.findOne({ where: { product_id: productId } });
  }

  async findActive() {
    return this.repo.find({
      where: { estado: "activo" },
      order: { fecha_fin: "ASC" },
    });
  }

  async findEnded() {
    return this.repo.find({
      where: { estado: "cerrado" },
      order: { updated_at: "DESC" },
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
    const auction = await this.repo.findOne({ where: { id: auctionId } });
    if (!auction) throw new NotFoundException("Subasta no encontrada");
    if (auction.estado !== "activo") throw new BadRequestException("La subasta no está activa");
    if (auction.vendedor_id === postorId) throw new ForbiddenException("No puedes pujar en tu propia subasta");
    if (new Date() > new Date(auction.fecha_fin)) throw new BadRequestException("La subasta ya terminó");
    if (monto < auction.precio_actual + auction.incremento_minimo) {
      throw new BadRequestException(`La puja debe ser al menos S/ ${(auction.precio_actual + auction.incremento_minimo).toFixed(2)}`);
    }

    const bid = await this.bidsRepo.save(this.bidsRepo.create({
      auction_id: auctionId,
      postor_id: postorId,
      monto,
    }));

    auction.precio_actual = monto;
    await this.repo.save(auction);

    return bid;
  }

  async getBids(auctionId: string) {
    return this.bidsRepo.find({
      where: { auction_id: auctionId },
      order: { monto: "DESC" },
      take: 50,
    });
  }

  async closeExpired() {
    const expired = await this.repo.find({
      where: {
        estado: "activo",
        fecha_fin: LessThan(new Date()),
      },
    });
    for (const auction of expired) {
      const highestBid = await this.bidsRepo.findOne({
        where: { auction_id: auction.id },
        order: { monto: "DESC" },
      });
      auction.estado = "cerrado";
      auction.ganador_id = highestBid?.postor_id || undefined;
      await this.repo.save(auction);
    }
    return expired.length;
  }
}
