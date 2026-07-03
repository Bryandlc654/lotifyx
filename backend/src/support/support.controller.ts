import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { SupportService } from "./support.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermission } from "../auth/decorators/permissions.decorator";
import { CreateTicketDto } from "./dto/create-ticket.dto";

@Controller()
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post("support/tickets")
  @HttpCode(HttpStatus.CREATED)
  create(@Body() body: CreateTicketDto) { return this.service.create(body); }

  @Get("support/tickets/:ticketNumber")
  findByNumber(@Param("ticketNumber") ticketNumber: string) { return this.service.findByTicketNumber(ticketNumber); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("support.read")
  @Get("admin/support")
  findAllAdmin() { return this.service.findAllAdmin(); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("support.write")
  @Put("admin/support/:id")
  @HttpCode(HttpStatus.OK)
  update(@Param("id") id: string, @Body() body: any) { return this.service.update(id, body); }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermission("support.read")
  @HttpCode(HttpStatus.OK)
  @Delete("admin/support/:id")
  remove(@Param("id") id: string) { return this.service.remove(id); }
}
