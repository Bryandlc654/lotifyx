import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CategoriesService } from "./categories.service";
import { R2Storage } from "../r2/r2-storage";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

const storage = new R2Storage({ folder: "categories" });

@Controller("categories")
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get(":id")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("categories.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("icon", { storage }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: any) {
    return this.service.create(dto, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("categories.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("icon", { storage }))
  update(@Param("id") id: string, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(id, dto, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("categories.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
