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
import { diskStorage } from "multer";
import { extname } from "path";
import { BannersService } from "./banners.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("banners")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Get()
  @Roles("superadmin")
  findAll() {
    return this.bannersService.findAll();
  }

  @Post()
  @Roles("superadmin")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
    })
  )
  create(@UploadedFile() file: Express.Multer.File, @Body("title") title: string) {
    return this.bannersService.create(title, file);
  }

  @Put(":id")
  @Roles("superadmin")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) => {
          const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new Error("Solo se permiten imágenes"), false);
        } else {
          cb(null, true);
        }
      },
    })
  )
  update(
    @Param("id") id: string,
    @Body("title") title: string,
    @UploadedFile() file?: Express.Multer.File
  ) {
    console.log("update called", id, title, file?.filename);
    return this.bannersService.update(id, title, file);
  }

  @Delete(":id")
  @Roles("superadmin")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.bannersService.remove(id);
  }
}
