import { Controller, Get, Patch, Param, Query, UseGuards } from "@nestjs/common";
import { ProductsService } from "../products/products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/products")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermission("products.read")
  findAll(@Query("status") status?: string) {
    return this.productsService.findAllAdmin(status);
  }

  @Patch(":id/approve")
  @RequirePermission("products.approve")
  approve(@Param("id") id: string) {
    return this.productsService.approve(id);
  }

  @Patch(":id/reject")
  @RequirePermission("products.approve")
  reject(@Param("id") id: string) {
    return this.productsService.reject(id);
  }
}
