import { DataSource } from "typeorm";
import { AuditService } from "../audit/audit.service";
import { MailService } from "../mail/mail.service";
export declare class CheckoutService {
    private readonly dataSource;
    private readonly audit;
    private readonly mail;
    constructor(dataSource: DataSource, audit: AuditService, mail: MailService);
    getOrders(userId: string): Promise<any[]>;
    findAllOrders(status?: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getDashboard(userId: string): Promise<{
        products: any;
        sales: any;
        recentOrders: any;
        recentProducts: any;
    }>;
    approveOrder(id: string): Promise<{
        message: string;
    }>;
    updateOrderStatus(id: string, status: string): Promise<{
        message: string;
    }>;
    createClaim(data: {
        userId: string;
        orderId: string;
        reason: string;
        description: string;
        solution: string;
        amount: number | null;
    }): Promise<{
        message: string;
    }>;
    findAllClaims(): Promise<any>;
    updateClaimStatus(id: string, status: string, response?: string): Promise<{
        message: string;
    }>;
    getOrderDetail(orderId: string, userId: string): Promise<any>;
    updateOrderTracking(orderId: string, userId: string, data: {
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
    rejectOrder(id: string, motivo: string): Promise<{
        message: string;
    }>;
    getSales(userId: string): Promise<any[]>;
    createOrder(data: {
        userId: string;
        total: number;
        items: {
            id: string;
            price: number;
        }[];
        originAccountId: string;
        operationNumber: string;
        amount: number;
        proofUrl: string;
    }): Promise<any>;
    getFunds(userId: string): Promise<{
        available_balance: number;
        pending_balance: number;
        disputed_balance: number;
    }>;
    getWithdrawals(userId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    requestWithdrawal(userId: string, data: {
        amount: number;
        bank_name: string;
        account_number: string;
        account_holder: string;
    }): Promise<{
        message: string;
    }>;
    processWithdrawal(id: string, status: string): Promise<{
        message: string;
    }>;
    findAllWithdrawals(page?: number, limit?: number): Promise<{
        data: any;
        total: number;
        page: number;
        totalPages: number;
    }>;
    toggleWithdrawalDeposit(id: string): Promise<{
        message: string;
    }>;
}
