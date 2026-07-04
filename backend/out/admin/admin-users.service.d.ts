import { Repository } from "typeorm";
import { User } from "../auth/entities/user.entity";
import { AuditService } from "../audit/audit.service";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";
export declare class AdminUsersService {
    private readonly userRepo;
    private readonly profileRepo;
    private readonly vfyRepo;
    private readonly audit;
    constructor(userRepo: Repository<User>, profileRepo: Repository<UserProfile>, vfyRepo: Repository<UserVerification>, audit: AuditService);
    findAll(query: {
        search?: string;
        role?: string;
        status?: string;
        is_admin?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        data: {
            id: string;
            role: import("../auth/entities/role.entity").Role;
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
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        role: import("../auth/entities/role.entity").Role;
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
    create(dto: {
        email: string;
        password: string;
        phone?: string;
        role_id?: string;
        status?: string;
        first_name: string;
        last_name: string;
        document_type?: string;
        document_number?: string;
    }): Promise<{
        id: string;
        role: import("../auth/entities/role.entity").Role;
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
    update(id: string, dto: Partial<{
        email: string;
        phone: string;
        role_id: string;
        status: string;
        is_verified: boolean;
        first_name: string;
        last_name: string;
        document_type: string;
        document_number: string;
        ruc: string;
        razon_social: string;
    }>): Promise<{
        id: string;
        role: import("../auth/entities/role.entity").Role;
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
    toggleActive(id: string): Promise<{
        status: string;
        id: string;
        role: import("../auth/entities/role.entity").Role;
        role_id: string;
        email: string;
        phone: string;
        provider: string;
        is_verified: boolean;
        referral_code: string;
        referred_by: string;
        created_at: Date;
        updated_at: Date;
        profile: UserProfile;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
    getRoles(): Promise<import("typeorm").ObjectLiteral[]>;
}
