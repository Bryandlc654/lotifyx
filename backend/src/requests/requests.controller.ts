import { Controller, Get, Post, Put, Delete, Param, Body, Req, Query, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { RequestsService } from "./requests.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("requests")
export class RequestsController {
  constructor(private readonly service: RequestsService) {}

  // Públicos
  @Get()
  @HttpCode(HttpStatus.OK)
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  get(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  // Autenticados
  @UseGuards(JwtAuthGuard)
  @Get("my/requests")
  @HttpCode(HttpStatus.OK)
  myRequests(@Req() req) {
    return this.service.listMine(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("my/offers")
  @HttpCode(HttpStatus.OK)
  myOffers(@Req() req) {
    return this.service.listSellerOffers(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Req() req, @Body() dto: any) {
    return this.service.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @HttpCode(HttpStatus.OK)
  update(@Req() req, @Param("id") id: string, @Body() dto: any) {
    return this.service.update(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  cancel(@Req() req, @Param("id") id: string) {
    return this.service.cancel(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/offers")
  @HttpCode(HttpStatus.OK)
  offers(@Req() req, @Param("id") id: string) {
    return this.service.offersForRequest(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id/my-offer")
  @HttpCode(HttpStatus.OK)
  myOffer(@Req() req, @Param("id") id: string) {
    return this.service.myOffer(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/offers")
  @HttpCode(HttpStatus.CREATED)
  makeOffer(@Req() req, @Param("id") id: string, @Body() dto: any) {
    return this.service.makeOffer(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/coincidencia")
  @HttpCode(HttpStatus.OK)
  coincidencia(@Req() req, @Param("id") id: string, @Body() dto: any) {
    return this.service.checkCoincidencia(req.user.id, id, dto?.product_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/offers/:offerId/accept")
  @HttpCode(HttpStatus.OK)
  accept(@Req() req, @Param("id") id: string, @Param("offerId") offerId: string, @Body() dto: any) {
    return this.service.acceptOffer(req.user.id, id, offerId, dto);
  }
}
