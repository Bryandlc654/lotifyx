import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { BannersService } from "./banners.service";
import { R2Storage } from "../r2/r2-storage";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

@Controller("banners")
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("banners.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: new R2Storage({ folder: "banners" }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  create(@UploadedFile() file: Express.Multer.File, @Body("title") title: string) {
    return this.bannersService.create(title, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("banners.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: new R2Storage({ folder: "banners" }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    })
  )
  update(
    @Param("id") id: string,
    @Body("title") title: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return this.bannersService.update(id, title, file);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("banners.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.bannersService.remove(id);
  }
}
