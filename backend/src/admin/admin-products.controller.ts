import { Controller, Get, Patch, Delete, Param, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
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
  findAll(
    @Query("status") status?: string,
    @Query("sort") sort?: "ASC" | "DESC",
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.productsService.findAllAdmin(status, sort, page || 1, limit || 20);
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

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @RequirePermission("products.delete")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }
}
