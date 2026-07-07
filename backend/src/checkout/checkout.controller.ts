import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  UseGuards,
  Req,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CheckoutService } from "./checkout.service";
import { R2Storage } from "../r2/r2-storage";

@Controller("checkout")
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("orders")
  getOrders(@Req() req) {
    return this.checkoutService.getOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("dashboard")
  getDashboard(@Req() req) {
    return this.checkoutService.getDashboard(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sales")
  getSales(@Req() req) {
    return this.checkoutService.getSales(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("submit")
  @UseInterceptors(
    FileInterceptor("proof", {
      storage: new R2Storage({ folder: "proofs" }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException("Solo se permiten imágenes"), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async submit(
    @Req() req,
    @Body() body: { items: string; origin_account_id: string; operation_number: string; amount: string; bid_id?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("El comprobante de pago es obligatorio");
    if (!body.origin_account_id || !body.operation_number || !body.amount) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }

    let items: { id: string; price: number }[] = [];
    if (body.items) {
      try {
        items = JSON.parse(body.items);
      } catch {
        throw new BadRequestException("items debe ser un JSON válido");
      }
    }

    const proofUrl = file.filename;
    const total = items.reduce((sum, i) => sum + i.price, 0);

    const order = await this.checkoutService.createOrder({
      userId: req.user.id,
      total,
      items,
      originAccountId: body.origin_account_id,
      operationNumber: body.operation_number,
      amount: parseFloat(body.amount),
      proofUrl,
    });

    // Link bid to order and add auction product as order item
    if (body.bid_id) {
      try {
        const result = await this.dataSource.query(
          `UPDATE auction_bids SET checkout_id = $1 WHERE id = $2 AND estado = 'pendiente' RETURNING *`,
          [order.id, body.bid_id],
        );
        // TypeORM returns [rows, rowCount] for UPDATE queries, not just rows[]
        const bidRows = Array.isArray(result?.[0]) ? result[0] : (result || []);
        const bid = bidRows.length > 0 ? bidRows[0] : null;
        if (bid) {
          const auction = await this.dataSource.query(
            `SELECT product_id FROM auctions WHERE id = $1`, [bid.auction_id]
          );
          if (auction.length > 0 && auction[0].product_id) {
            const pid = auction[0].product_id;
            await this.dataSource.query(
              `INSERT INTO order_items (order_id, product_id, price, created_at) VALUES ($1, $2, $3, NOW())`,
              [order.id, pid, parseFloat(body.amount)],
            );
            await this.dataSource.query(
              `UPDATE orders SET total_amount = $1 WHERE id = $2`,
              [parseFloat(body.amount), order.id],
            );
            console.log(`[Checkout] Auction item added: order=${order.id.slice(0,8)} product=${pid.slice(0,8)}`);
          }
        }
      } catch (e: any) {
        console.error(`[Checkout] Error linking bid:`, e.message);
      }
    }

    return { message: "Depósito enviado correctamente", order };
  }

  @UseGuards(JwtAuthGuard)
  @Post("claims")
  @HttpCode(HttpStatus.CREATED)
  async createClaim(@Req() req, @Body() body: { order_id: string; reason: string; description: string; solution: string; amount?: string }) {
    if (!body.order_id || !body.reason || !body.description || !body.solution) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }
    return this.checkoutService.createClaim({
      userId: req.user.id,
      orderId: body.order_id,
      reason: body.reason,
      description: body.description,
      solution: body.solution,
      amount: body.amount ? parseFloat(body.amount) : null,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get("orders/:id")
  async getOrder(@Req() req, @Param("id") id: string) {
    return this.checkoutService.getOrderDetail(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("orders/:id/tracking")
  async updateTracking(
    @Req() req,
    @Param("id") id: string,
    @Body() body: { status: string; note?: string; shipping_address?: string; shipping_reference?: string; shipping_city?: string; shipping_notes?: string; tracking_number?: string },
  ) {
    return this.checkoutService.updateOrderTracking(id, req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("funds")
  async getFunds(@Req() req) {
    return this.checkoutService.getFunds(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("funds/withdrawals")
  async getWithdrawals(@Req() req, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.checkoutService.getWithdrawals(req.user.id, page || 1, limit || 10);
  }

  @UseGuards(JwtAuthGuard)
  @Post("funds/withdraw")
  @HttpCode(HttpStatus.CREATED)
  async requestWithdrawal(@Req() req, @Body() body: { amount: number; bank_name: string; account_number: string; account_holder: string }) {
    if (!body.amount || !body.bank_name || !body.account_number || !body.account_holder) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }
    return this.checkoutService.requestWithdrawal(req.user.id, body);
  }
}
