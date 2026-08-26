import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query, UseGuards } from "@nestjs/common";
import { AuctionMatrixService } from "../auction-matrix/auction-matrix.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("admin/matrix")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminMatrixController {
  constructor(private readonly matrixService: AuctionMatrixService) {}

  @Get()
  @RequirePermission("products.write")
  findAll(@Query("activo") activo?: string) {
    const a = activo === "true" ? true : activo === "false" ? false : undefined;
    return this.matrixService.findAll(a);
  }

  @Get(":id")
  @RequirePermission("products.write")
  findOne(@Param("id") id: string) {
    return this.matrixService.findOne(id);
  }

  @Get("canal/:canal")
  @RequirePermission("products.read")
  reglasPorCanal(@Param("canal") canal: string) {
    return this.matrixService.reglasPorCanal(canal);
  }

  @Post()
  @RequirePermission("products.write")
  create(@Body() dto: any, @Req() req: any) {
    return this.matrixService.create({ ...dto, actorId: req.user.id });
  }

  @Put(":id")
  @RequirePermission("products.write")
  update(@Param("id") id: string, @Body() dto: any, @Req() req: any) {
    return this.matrixService.update(id, { ...dto, actorId: req.user.id });
  }

  @Delete(":id")
  @RequirePermission("products.write")
  remove(@Param("id") id: string, @Req() req: any) {
    return this.matrixService.remove(id, req.user.id);
  }
}
