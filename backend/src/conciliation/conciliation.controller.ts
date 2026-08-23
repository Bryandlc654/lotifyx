import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Query,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { R2Storage } from "../r2/r2-storage";
import { ConciliationService, ManualPaymentDto } from "./conciliation.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ConciliationController {
  constructor(private readonly conciliationService: ConciliationService) {}

  /** RF: registro de pagos manuales por el administrador */
  @Post("payments/manual")
  @RequirePermission("orders.approve")
  @UseInterceptors(
    FileInterceptor("proof", {
      storage: new R2Storage({ folder: "manual-payments" }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) { cb(new BadRequestException("Solo se permiten imágenes"), false); return; }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  registerManualPayment(@Req() req, @Body() body: ManualPaymentDto, @UploadedFile() file?: Express.Multer.File) {
    return this.conciliationService.registerManualPayment(req.user.id, body, file?.filename);
  }

  @Get("payments/manual")
  @RequirePermission("orders.read")
  listManualPayments() {
    return this.conciliationService.listManualPayments();
  }

  /** RF: carga de archivo TXT bancario para contraste con estados de cuenta */
  @Post("conciliation/txt")
  @RequirePermission("orders.approve")
  @UseInterceptors(FileInterceptor("file"))
  @HttpCode(HttpStatus.OK)
  importTxt(@Req() req, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Adjunta el archivo TXT del banco");
    const content = Buffer.from(file.buffer).toString("utf8");
    return this.conciliationService.importBankTxt(req.user.id, content);
  }

  /** RF: conciliación bancaria */
  @Get("conciliation")
  @RequirePermission("orders.read")
  getReport(@Query("batch_id") batchId?: string) {
    return this.conciliationService.getReport(batchId || undefined);
  }
}
