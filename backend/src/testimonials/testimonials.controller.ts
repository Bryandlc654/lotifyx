import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { TestimonialsService } from "./testimonials.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("testimonials")
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: { stars: number; text: string; name: string; cargo: string }) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Put("reorder")
  @HttpCode(HttpStatus.OK)
  reorder(@Body("ids") ids: string[]) {
    return this.service.reorder(ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
