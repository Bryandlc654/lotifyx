import { Controller, Get, Post, Put, Delete, Param, Body, Req, UseGuards, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("products")
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll(@Query("category_id") categoryId?: string) { return this.service.findAllActive(categoryId); }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  findMine(@Req() req) { return this.service.findByUser(req.user.id); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any, @Req() req) {
    return this.service.create({ ...dto, user_id: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
