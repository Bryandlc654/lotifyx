import { Controller, Get, Delete, Param, Query, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ReviewsService } from "../reviews/reviews.service";

@UseGuards(JwtAuthGuard)
@Controller("admin/reviews")
export class AdminReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  getAll(@Req() req, @Query("page") page?: number, @Query("limit") limit?: number) {
    return this.reviews.getAdminReviews(page || 1, limit || 20);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reviews.deleteReview(id);
  }
}
