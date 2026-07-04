import { CheckoutService } from "../checkout/checkout.service";
export declare class AdminOrdersController {
    private readonly checkoutService;
    constructor(checkoutService: CheckoutService);
    findAll(status?: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    approve(id: string): Promise<{
        message: string;
    }>;
    reject(id: string, motivo: string): Promise<{
        message: string;
    }>;
    updateStatus(id: string, status: string): Promise<{
        message: string;
    }>;
    findClaims(): Promise<any>;
    updateClaim(id: string, status: string): Promise<{
        message: string;
    }>;
}
