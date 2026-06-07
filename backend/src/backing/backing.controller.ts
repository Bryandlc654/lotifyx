import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { BackingService } from "./backing.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";

const storage = diskStorage({
  destination: "./uploads",
  filename: (_req, file, cb) => { cb(null, `backing-${Date.now()}-${Math.round(Math.random()*1e9)}${extname(file.originalname)}`); },
});

@Controller("backing")
export class BackingController {
  constructor(private readonly service: BackingService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage }))
  create(@UploadedFile() file: Express.Multer.File, @Body("name") name: string) { return this.service.create(name, file); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage }))
  update(@Param("id") id: string, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) { return this.service.update(id, dto, file); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("superadmin")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
