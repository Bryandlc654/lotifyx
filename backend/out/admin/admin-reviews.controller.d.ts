import { ReviewsService } from "../reviews/reviews.service";
export declare class AdminReviewsController {
    private readonly reviews;
    constructor(reviews: ReviewsService);
    getAll(req: any, page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
