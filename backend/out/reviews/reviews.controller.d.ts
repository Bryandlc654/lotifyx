import { ReviewsService } from "./reviews.service";
export declare class ReviewsController {
    private readonly reviews;
    constructor(reviews: ReviewsService);
    create(req: any, body: {
        product_id: string;
        order_id: string;
        rating: number;
        comment?: string;
        images?: string[];
    }): Promise<any>;
    getMine(req: any): Promise<any>;
    getByOrder(orderId: string): Promise<any>;
    getByProduct(productId: string): Promise<any>;
    getBySeller(req: any): Promise<any>;
}
