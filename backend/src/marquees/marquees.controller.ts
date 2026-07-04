import {
  Controller, Get, Post, Put, Delete, Param, UseGuards,
  UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { MarqueesService } from "./marquees.service";
import { R2Storage } from "../r2/r2-storage";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

const storage = new R2Storage({ folder: "marquees" });
const fileFilter = (_req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/^image\//)) cb(new Error("Solo imágenes"), false);
  else cb(null, true);
};
const limits = { fileSize: 5 * 1024 * 1024 };

@Controller("marquees")
export class MarqueesController {
  constructor(private readonly service: MarqueesService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("marquees.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage, fileFilter, limits }))
  create(@UploadedFile() file: Express.Multer.File, @Body("name") name: string) {
    return this.service.create(name, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("marquees.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage, fileFilter, limits }))
  update(@Param("id") id: string, @Body("name") name: string, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(id, name, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("marquees.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
