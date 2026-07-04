import { OnModuleInit } from "@nestjs/common";
import { DataSource } from "typeorm";
export declare class ReviewsService implements OnModuleInit {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    onModuleInit(): Promise<void>;
    createReview(userId: string, productId: string, orderId: string, rating: number, comment: string, images: string[]): Promise<any>;
    getMyReviews(userId: string): Promise<any>;
    getOrderReviews(orderId: string): Promise<any>;
    getProductReviews(productId: string): Promise<any>;
    getReviewsForSeller(sellerId: string): Promise<any>;
    getAdminReviews(page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    deleteReview(id: string): Promise<{
        message: string;
    }>;
}
