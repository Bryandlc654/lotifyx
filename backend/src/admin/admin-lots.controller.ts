import { Controller, Get, Put, Param, Body, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { LotsService } from "../lots/lots.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/lots")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminLotsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly lotsService: LotsService,
  ) {}

  @Get()
  @RequirePermission("products.read")
  findAll(
    @Query("status") status?: string,
    @Query("sort") sort?: "ASC" | "DESC",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.productsService.findAdminLots(status, sort, page || 1, limit || 20);
  }

  @Get(":id")
  @RequirePermission("products.read")
  async findOne(@Param("id") id: string) {
    const [lot] = await this.lotsService.getLotsRaw([id]);
    const tiers = await this.lotsService.getTiers(id);
    const participants = await this.lotsService.getParticipants(id);
    const benefits = await this.lotsService.getBenefitApplications(id);
    return { lot: lot || null, tiers, participants, benefits };
  }

  @Get(":id/benefits")
  @RequirePermission("products.read")
  getBenefits(@Param("id") id: string) {
    return this.lotsService.getBenefitApplications(id);
  }

  @Put(":id/pricing")
  @RequirePermission("products.update")
  savePricing(@Param("id") id: string, @Body() body: any) {
    return this.lotsService.savePricing(id, body.tiers);
  }
}
