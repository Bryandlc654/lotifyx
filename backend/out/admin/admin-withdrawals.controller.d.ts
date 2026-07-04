import { CheckoutService } from "../checkout/checkout.service";
export declare class AdminWithdrawalsController {
    private readonly checkoutService;
    constructor(checkoutService: CheckoutService);
    findAll(page?: number, limit?: number): Promise<{
        data: any;
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
    toggleDeposit(id: string): Promise<{
        message: string;
    }>;
}
