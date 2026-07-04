import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { SecondaryBannersService } from "./secondary-banners.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { R2Storage } from "../r2/r2-storage";

const storage = new R2Storage({ folder: "secondary-banners" });

@Controller("secondary-banners")
export class SecondaryBannersController {
  constructor(private readonly service: SecondaryBannersService) {}

  @Get()
  findAll(@Query("type") type?: string) {
    if (type) return this.service.findByType(type);
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("secondary_banners.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: any) {
    return this.service.create(dto, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("secondary_banners.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage }))
  update(@Param("id") id: string, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(id, dto, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("secondary_banners.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
