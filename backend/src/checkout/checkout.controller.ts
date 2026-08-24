import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CheckoutService } from "./checkout.service";
import { OrdersService } from "./orders.service";
import { FundsService } from "./funds.service";
import { ClaimsService } from "./claims.service";
import { SubmitCheckoutDto } from "./dto/submit-checkout.dto";
import { R2Storage } from "../r2/r2-storage";
import { AuditService } from "../audit/audit.service";

@Controller("checkout")
export class CheckoutController {
  constructor(
    private readonly checkoutService: CheckoutService,
    private readonly ordersService: OrdersService,
    private readonly fundsService: FundsService,
    private readonly claimsService: ClaimsService,
    private readonly audit: AuditService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("orders")
  getOrders(@Req() req) {
    return this.ordersService.getOrders(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("dashboard")
  getDashboard(@Req() req) {
    return this.ordersService.getDashboard(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("sales")
  getSales(@Req() req) {
    return this.ordersService.getSales(req.user.id);
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
    @Body() body: SubmitCheckoutDto,
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
    const total = items.reduce((sum, i: any) => sum + i.price * (Math.max(1, Math.floor(Number(i.qty) || 1))), 0);

    // Validación de coincidencia de montos entre el pedido y el pago registrado
    const declaredAmount = parseFloat(body.amount);
    if (items.length > 0 && total > 0 && Math.abs(total - declaredAmount) >= 0.01) {
      throw new BadRequestException(
        `El monto declarado no coincide con el total del pedido: esperado S/ ${total.toFixed(2)}, declarado S/ ${declaredAmount.toFixed(2)}`
      );
    }

    const order = await this.checkoutService.createOrder({
      userId: req.user.id,
      total,
      items,
      originAccountId: body.origin_account_id,
      operationNumber: body.operation_number,
      amount: parseFloat(body.amount),
      proofUrl,
      servicioDescripcion: body.servicio_descripcion?.trim() || null,
      entregaModalidad: ["recojo_tienda", "delivery_externo"].includes(body.entrega_modalidad || "") ? body.entrega_modalidad : null,
    });

    // Link bid to order and add auction product as order item
    if (body.bid_id) {
      try {
        const result = await this.dataSource.query(
          `UPDATE auction_bids SET checkout_id = $1 WHERE id = $2 AND estado = 'pendiente' RETURNING *`,
          [order.id, body.bid_id],
        );
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

    // Trazabilidad: registro del pago enviado por el comprador
    this.audit.log({
      userId: req.user.id,
      action: "payment_submitted",
      entity: "order",
      entityId: order.id,
      details: { operation_number: body.operation_number, amount: declaredAmount },
    });

    return { message: "Depósito enviado correctamente", order };
  }

  @UseGuards(JwtAuthGuard)
  @Post("orders/:id/cancel")
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @Req() req,
    @Param("id") id: string,
    @Body("reason") reason?: string,
  ) {
    return this.checkoutService.cancelOrder(req.user.id, id, reason?.trim() || "Cancelado por el comprador", false);
  }

  @UseGuards(JwtAuthGuard)
  @Post("claims")
  @HttpCode(HttpStatus.CREATED)
  async createClaim(@Req() req, @Body() body: { order_id: string; reason: string; description: string; solution: string; amount?: string }) {
    if (!body.order_id || !body.reason || !body.description || !body.solution) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }
    return this.claimsService.createClaim({
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
    return this.ordersService.getOrderDetail(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("orders/:id/pay")
  @UseInterceptors(
    FileInterceptor("proof", {
      storage: new R2Storage({ folder: "proofs" }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) { cb(new BadRequestException("Solo imagenes"), false); return; }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.OK)
  async payRemaining(
    @Req() req,
    @Param("id") id: string,
    @Body() body: { operation_number: string; amount: string; origin_account_id: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Comprobante obligatorio");
    if (!body.operation_number || !body.amount) throw new BadRequestException("Completa todos los campos obligatorios");
    // Verificar que la orden pertenece al usuario
    const order = await this.ordersService.getOrderDetail(id, req.user.id);
    if (!order || order.status !== "pending_payment") throw new BadRequestException("La orden no está disponible para confirmar el pago");
    // Validación de coincidencia de montos entre el pedido y el pago registrado
    const declaredAmount = parseFloat(body.amount);
    const expected = Number((order as any).amount ?? order.total_amount);
    if (Number.isFinite(expected) && Math.abs(expected - declaredAmount) >= 0.01) {
      throw new BadRequestException(
        `El monto declarado no coincide con el total del pedido: esperado S/ ${expected.toFixed(2)}, declarado S/ ${declaredAmount.toFixed(2)}`
      );
    }
    // Actualizar orden con comprobante
    await this.dataSource.query(
      `UPDATE orders SET status = 'pending_payment', operation_number = $2, amount = $3, proof_image = $4, origin_account_id = $5, updated_at = NOW() WHERE id = $1`,
      [id, body.operation_number, declaredAmount, file.filename, body.origin_account_id || null],
    );
    // Trazabilidad: reenvío del pago por el comprador
    this.audit.log({
      userId: req.user.id,
      action: "payment_resubmitted",
      entity: "order",
      entityId: id,
      details: { operation_number: body.operation_number, amount: declaredAmount },
    });
    return { message: "Comprobante enviado correctamente" };
  }

  @UseGuards(JwtAuthGuard)
  @Patch("orders/:id/confirm-provider")
  async confirmProvider(@Req() req, @Param("id") id: string) {
    return this.checkoutService.confirmProvider(id, req.user.id);
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
    return this.fundsService.getFunds(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("funds/withdrawals")
  async getWithdrawals(@Req() req, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.fundsService.getWithdrawals(req.user.id, page || 1, limit || 10);
  }

  @UseGuards(JwtAuthGuard)
  @Post("funds/withdraw")
  @HttpCode(HttpStatus.CREATED)
  async requestWithdrawal(@Req() req, @Body() body: { amount: number; bank_name: string; account_number: string; account_holder: string }) {
    if (!body.amount || !body.bank_name || !body.account_number || !body.account_holder) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }
    return this.fundsService.requestWithdrawal(req.user.id, body);
  }
}
