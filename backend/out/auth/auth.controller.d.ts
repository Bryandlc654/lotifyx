import { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, req: any): Promise<{
        message: string;
    }>;
    login(dto: LoginDto, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            role: import("./entities/role.entity").Role;
            role_id: string;
            email: string;
            phone: string;
            provider: string;
            is_verified: boolean;
            status: string;
            referral_code: string;
            referred_by: string;
            created_at: Date;
            updated_at: Date;
            profile: import("./entities/user-profile.entity").UserProfile;
        };
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        user: {
            id: string;
            role: import("./entities/role.entity").Role;
            role_id: string;
            email: string;
            phone: string;
            provider: string;
            is_verified: boolean;
            status: string;
            referral_code: string;
            referred_by: string;
            created_at: Date;
            updated_at: Date;
            profile: import("./entities/user-profile.entity").UserProfile;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    googleAuth(): void;
    googleCallback(req: any, res: Response): Promise<void>;
    getCsrfToken(res: Response): {
        csrfToken: string;
    };
    setReferral(ref: string, res: Response): {
        message: string;
    };
    refresh(req: any, bodyToken: string, res: Response): Promise<{
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    logout(req: any, bodyToken: string, res: Response): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
        message: string;
        user: {
            id: string;
            role: import("./entities/role.entity").Role;
            role_id: string;
            email: string;
            phone: string;
            provider: string;
            is_verified: boolean;
            status: string;
            referral_code: string;
            referred_by: string;
            created_at: Date;
            updated_at: Date;
            profile: import("./entities/user-profile.entity").UserProfile;
        };
    }>;
    updateProfile(req: any, dto: any): Promise<{
        id: string;
        role: import("./entities/role.entity").Role;
        role_id: string;
        email: string;
        phone: string;
        provider: string;
        is_verified: boolean;
        status: string;
        referral_code: string;
        referred_by: string;
        created_at: Date;
        updated_at: Date;
        profile: import("./entities/user-profile.entity").UserProfile;
    }>;
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        url: string;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    selectPlan(req: any, planId: string): Promise<{
        message: string;
    }>;
    getMyPlan(req: any): Promise<any>;
    getBankAccounts(req: any): Promise<any>;
    saveBankAccount(req: any, dto: {
        bank_name: string;
        account_number: string;
        account_holder?: string;
        account_type?: string;
    }): Promise<any>;
    updateBankAccount(req: any, id: string, dto: {
        bank_name?: string;
        account_number?: string;
        account_holder?: string;
        account_type?: string;
    }): Promise<any>;
    deleteBankAccount(req: any, id: string): Promise<{
        message: string;
    }>;
    submitPayment(req: any, body: {
        operation_number: string;
        amount: string;
        origin_account_id?: string;
    }, file: Express.Multer.File): Promise<{
        message: string;
    }>;
}
