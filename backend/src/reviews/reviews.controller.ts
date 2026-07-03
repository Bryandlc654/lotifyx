import { Controller, Get, Post, Param, Query, UseGuards, Req, Body, BadRequestException } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ReviewsService } from "./reviews.service";

@Controller("reviews")
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() body: { product_id: string; order_id: string; rating: number; comment?: string; images?: string[] }) {
    if (!body.product_id || !body.order_id || body.rating == null) {
      throw new BadRequestException("product_id, order_id y rating son obligatorios");
    }
    if (body.rating < 0 || body.rating > 5) {
      throw new BadRequestException("Rating debe estar entre 0 y 5");
    }
    return this.reviews.createReview(req.user.id, body.product_id, body.order_id, body.rating, body.comment || "", body.images || []);
  }

  @UseGuards(JwtAuthGuard)
  @Get("mine")
  getMine(@Req() req) {
    return this.reviews.getMyReviews(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("order/:orderId")
  getByOrder(@Param("orderId") orderId: string) {
    return this.reviews.getOrderReviews(orderId);
  }

  @Get("product/:productId")
  getByProduct(@Param("productId") productId: string) {
    return this.reviews.getProductReviews(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get("seller")
  getBySeller(@Req() req) {
    return this.reviews.getReviewsForSeller(req.user.id);
  }
}
