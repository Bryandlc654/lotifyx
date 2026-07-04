import { CheckoutService } from "./checkout.service";
export declare class CheckoutController {
    private readonly checkoutService;
    constructor(checkoutService: CheckoutService);
    getOrders(req: any): Promise<any[]>;
    getDashboard(req: any): Promise<{
        products: any;
        sales: any;
        recentOrders: any;
        recentProducts: any;
    }>;
    getSales(req: any): Promise<any[]>;
    submit(req: any, body: {
        items: string;
        origin_account_id: string;
        operation_number: string;
        amount: string;
    }, file: Express.Multer.File): Promise<{
        message: string;
        order: any;
    }>;
    createClaim(req: any, body: {
        order_id: string;
        reason: string;
        description: string;
        solution: string;
        amount?: string;
    }): Promise<{
        message: string;
    }>;
    getOrder(req: any, id: string): Promise<any>;
    updateTracking(req: any, id: string, body: {
        status: string;
        note?: string;
        shipping_address?: string;
        shipping_reference?: string;
        shipping_city?: string;
        shipping_notes?: string;
        tracking_number?: string;
    }): Promise<{
        message: string;
    }>;
    getFunds(req: any): Promise<{
        available_balance: number;
        pending_balance: number;
        disputed_balance: number;
    }>;
    getWithdrawals(req: any, page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    requestWithdrawal(req: any, body: {
        amount: number;
        bank_name: string;
        account_number: string;
        account_holder: string;
    }): Promise<{
        message: string;
    }>;
}
