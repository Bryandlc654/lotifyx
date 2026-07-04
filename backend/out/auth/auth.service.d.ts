import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { UserVerification } from "./entities/user-verification.entity";
import { Role } from "./entities/role.entity";
import { MailService } from "../mail/mail.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
export declare class AuthService {
    private readonly userRepository;
    private readonly profileRepository;
    private readonly refreshTokenRepository;
    private readonly verificationRepository;
    private readonly roleRepository;
    private readonly jwtService;
    private readonly mailService;
    constructor(userRepository: Repository<User>, profileRepository: Repository<UserProfile>, refreshTokenRepository: Repository<RefreshToken>, verificationRepository: Repository<UserVerification>, roleRepository: Repository<Role>, jwtService: JwtService, mailService: MailService);
    private generateReferralCode;
    private generateRefreshTokenValue;
    private generateTokens;
    private findOrCreateGoogleUser;
    register(dto: RegisterDto): Promise<{
        message: string;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        user: {
            id: string;
            role: Role;
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
            profile: UserProfile;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            role: Role;
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
            profile: UserProfile;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    googleLogin(profile: {
        googleId: string;
        email: string;
        name: string;
        picture: string | null;
    }): Promise<{
        user: {
            id: string;
            role: Role;
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
            profile: UserProfile;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    refreshAccessToken(refreshToken: string): Promise<{
        user: {
            id: string;
            role: Role;
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
            profile: UserProfile;
        };
        accessToken: string;
        refreshToken: string;
        message: string;
    }>;
    logout(refreshToken: string): Promise<{
        message: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        role: Role;
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
        profile: UserProfile;
    }>;
    updateProfile(userId: string, dto: any): Promise<{
        id: string;
        role: Role;
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
        profile: UserProfile;
    }>;
    getMyPlan(userId: string): Promise<any>;
    selectPlan(userId: string, planId: string): Promise<{
        message: string;
    }>;
    getBankAccounts(userId: string): Promise<any>;
    saveBankAccount(userId: string, dto: {
        bank_name: string;
        account_number: string;
        account_holder?: string;
        account_type?: string;
    }): Promise<any>;
    updateBankAccount(userId: string, accountId: string, dto: {
        bank_name?: string;
        account_number?: string;
        account_holder?: string;
        account_type?: string;
    }): Promise<any>;
    deleteBankAccount(userId: string, accountId: string): Promise<{
        message: string;
    }>;
    submitPayment(userId: string, dto: {
        operation_number: string;
        amount: number;
        proof_url: string;
        origin_account_id?: string;
    }): Promise<{
        message: string;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
