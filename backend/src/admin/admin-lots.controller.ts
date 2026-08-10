import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/lots")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminLotsController {
  constructor(private readonly productsService: ProductsService) {}

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
}
