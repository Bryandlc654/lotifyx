import {
  Controller, Get, Post, Put, Delete, Param, UseGuards,
  UseInterceptors, UploadedFile, Body, HttpCode, HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { MarqueesService } from "./marquees.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

const storage = diskStorage({
  destination: "./uploads",
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + extname(file.originalname));
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!file.mimetype.match(/^image\//)) cb(new Error("Solo imágenes"), false);
  else cb(null, true);
};

@Controller("marquees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarqueesController {
  constructor(private readonly service: MarqueesService) {}

  @Get()
  @Roles("superadmin")
  findAll() { return this.service.findAll(); }

  @Post()
  @Roles("superadmin")
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage, fileFilter }))
  create(@UploadedFile() file: Express.Multer.File, @Body("name") name: string) {
    return this.service.create(name, file);
  }

  @Put(":id")
  @Roles("superadmin")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage, fileFilter }))
  update(@Param("id") id: string, @Body("name") name: string, @UploadedFile() file?: Express.Multer.File) {
    return this.service.update(id, name, file);
  }

  @Delete(":id")
  @Roles("superadmin")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
