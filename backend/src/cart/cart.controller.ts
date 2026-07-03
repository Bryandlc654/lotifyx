import { Controller, Get, Post, Put, Delete, Param, Body, Req, Res, HttpCode, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { CartService } from "./cart.service";
import { v4 as uuid } from "uuid";

@Controller("cart")
export class CartController {
  constructor(private readonly service: CartService) {}

  private getCartId(req: any, res: Response): string {
    let cartId = req.cookies?.cart_id;
    if (!cartId) {
      cartId = uuid();
      res.cookie("cart_id", cartId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });
    }
    return cartId;
  }

  @Get()
  getCart(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    return this.service.getOrCreateCart(this.getCartId(req, res));
  }

  @Post("items")
  @HttpCode(HttpStatus.CREATED)
  addItem(@Req() req: any, @Res({ passthrough: true }) res: Response, @Body() body: any) {
    return this.service.addItem(this.getCartId(req, res), body);
  }

  @Put("items/:id")
  @HttpCode(HttpStatus.OK)
  updateQuantity(@Req() req: any, @Param("id") id: string, @Body("quantity") quantity: number) {
    return this.service.updateQuantity(req.cookies?.cart_id, id, quantity);
  }

  @Delete("items/:id")
  @HttpCode(HttpStatus.OK)
  removeItem(@Req() req: any, @Param("id") id: string) {
    return this.service.removeItem(req.cookies?.cart_id, id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  clearCart(@Req() req: any) {
    return this.service.clearCart(req.cookies?.cart_id);
  }
}
