import {
  Controller,
  Get,
  Post,
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
import { diskStorage } from "multer";
import { extname, join } from "path";
import { existsSync, mkdirSync } from "fs";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CheckoutService } from "./checkout.service";

const PROOF_DEST = "./uploads/proofs";

function ensureDir(dir: string) {
  return (_req: any, _file: any, cb: (err: Error | null, dir: string) => void) => {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    cb(null, dir);
  };
}

function fileName(_req: any, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) {
  cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
}

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

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
      storage: diskStorage({ destination: ensureDir(PROOF_DEST), filename: fileName }),
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
    @Body() body: { items: string; origin_account_id: string; operation_number: string; amount: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("El comprobante de pago es obligatorio");
    if (!body.items || !body.origin_account_id || !body.operation_number || !body.amount) {
      throw new BadRequestException("Todos los campos son obligatorios");
    }

    let items: { id: string; price: number }[];
    try {
      items = JSON.parse(body.items);
    } catch {
      throw new BadRequestException("items debe ser un JSON válido");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException("Debe incluir al menos un producto");
    }

    const proofUrl = `/uploads/proofs/${file.filename}`;
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
}
