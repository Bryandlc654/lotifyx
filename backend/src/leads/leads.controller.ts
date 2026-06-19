import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { CreateLeadDto } from "./create-lead.dto";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("leads")
export class LeadsController {
  constructor(
    private readonly service: LeadsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Get("db-info")
  async dbInfo() {
    const enc = await this.dataSource.query("SHOW server_encoding");
    const coll = await this.dataSource.query("SHOW lc_collate");
    return { encoding: enc, collation: coll };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("leads.read")
  findAll() { return this.service.findAll(); }

  @Get(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("leads.read")
  findOne(@Param("id") id: string) { return this.service.findOne(id); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("leads.delete")
  @HttpCode(HttpStatus.OK)
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
