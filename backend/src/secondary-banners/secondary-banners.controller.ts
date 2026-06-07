import {
  Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { SecondaryBannersService } from "./secondary-banners.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

const storage = diskStorage({
  destination: "./uploads",
  filename: (_req, file, cb) => { cb(null, `sb-${Date.now()}-${Math.round(Math.random()*1e9)}${extname(file.originalname)}`); },
});

@Controller("secondary-banners")
export class SecondaryBannersController {
  constructor(private readonly service: SecondaryBannersService) {}

  @Get()
  findAll(@Query("type") type?: string) {
    if (type) return this.service.findByType(type);
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage }))
  create(@UploadedFile() file: Express.Multer.File, @Body() dto: any) {
    return this.service.create(dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage }))
  update(@Param("id") id: string, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(id, dto, file);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
