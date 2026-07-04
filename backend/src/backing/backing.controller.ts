import {
  Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus,
  UseInterceptors, UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { BackingService } from "./backing.service";
import { R2Storage } from "../r2/r2-storage";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";

const storage = new R2Storage({ folder: "backing" });

@Controller("backing")
export class BackingController {
  constructor(private readonly service: BackingService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("backing.write")
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor("image", { storage }))
  create(@UploadedFile() file: Express.Multer.File, @Body("name") name: string) { return this.service.create(name, file); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("backing.write")
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("image", { storage }))
  update(@Param("id") id: string, @Body() dto: any, @UploadedFile() file?: Express.Multer.File) { return this.service.update(id, dto, file); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("backing.delete")
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
