import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LotSale } from "./lot-sale.entity";
import { LotParticipant } from "./lot-participant.entity";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class LotsService {
  constructor(
    @InjectRepository(LotSale)
    private readonly repo: Repository<LotSale>,
    @InjectRepository(LotParticipant)
    private readonly participantsRepo: Repository<LotParticipant>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findOpen() {
    return this.repo.find({ where: { estado: "abierto" }, order: { created_at: "DESC" } });
  }

  async findByProduct(productId: string) {
    return this.repo.findOne({ where: { product_id: productId } });
  }

  async create(dto: {
    product_id: string;
    vendedor_id: string;
    precio_lote: number;
    precio_individual: number;
    participantes_minimos?: number;
    fecha_cierre?: string;
  }) {
    const existing = await this.repo.findOne({ where: { product_id: dto.product_id } });
    if (existing) throw new BadRequestException("Este producto ya tiene una venta por lote activa");

    return this.repo.save(this.repo.create({
      product_id: dto.product_id,
      vendedor_id: dto.vendedor_id,
      precio_lote: dto.precio_lote,
      precio_individual: dto.precio_individual,
      participantes_minimos: dto.participantes_minimos || 1,
      fecha_cierre: dto.fecha_cierre ? new Date(dto.fecha_cierre) : null,
      estado: "abierto",
    }));
  }

  async join( lotSaleId: string, compradorId: string, cantidad: number = 1) {
    const lot = await this.repo.findOne({ where: { id: lotSaleId } });
    if (!lot) throw new NotFoundException("Venta por lote no encontrada");
    if (lot.estado !== "abierto") throw new BadRequestException("Esta venta por lote ya cerró");
    if (lot.vendedor_id === compradorId) throw new BadRequestException("No puedes unirte a tu propio lote");

    const existing = await this.participantsRepo.findOne({
      where: { lot_sale_id: lotSaleId, comprador_id: compradorId },
    });
    if (existing) throw new BadRequestException("Ya te uniste a este lote");

    return this.participantsRepo.save(this.participantsRepo.create({
      lot_sale_id: lotSaleId,
      comprador_id: compradorId,
      cantidad,
      estado: "pendiente",
    }));
  }

  async getParticipants(lotSaleId: string) {
    return this.participantsRepo.find({
      where: { lot_sale_id: lotSaleId },
      order: { created_at: "ASC" },
    });
  }

  async getParticipantCount(lotSaleId: string): Promise<number> {
    return this.participantsRepo.count({ where: { lot_sale_id: lotSaleId } });
  }
}
