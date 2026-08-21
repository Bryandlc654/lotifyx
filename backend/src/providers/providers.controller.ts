import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { ProvidersService } from "./providers.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("providers")
export class ProvidersController {
  constructor(private readonly service: ProvidersService) {}

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMine(@Req() req) {
    return this.service.getOrCreateProvider(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("me/zonas")
  @HttpCode(HttpStatus.OK)
  setZonas(@Req() req, @Body() dto: { zonas: string[] }) {
    return this.service.setZonas(req.user.id, dto?.zonas || []);
  }

  @UseGuards(JwtAuthGuard)
  @Put("me/disponibilidad")
  @HttpCode(HttpStatus.OK)
  setDisponibilidad(@Req() req, @Body() dto: { disponibilidad: Record<string, any> }) {
    return this.service.setDisponibilidad(req.user.id, dto?.disponibilidad || {});
  }

  @Get("public/:userId")
  getPublic(@Param("userId") userId: string) {
    return this.service.getProviderPublic(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/jobs")
  @HttpCode(HttpStatus.CREATED)
  addJob(@Req() req, @Body() dto: any) {
    return this.service.addJob(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("me/jobs/:jobId")
  @HttpCode(HttpStatus.OK)
  deleteJob(@Param("jobId") jobId: string, @Req() req) {
    return this.service.deleteJob(jobId, req.user.id);
  }
}
