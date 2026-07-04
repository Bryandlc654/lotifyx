import { AdminUsersService } from "./admin-users.service";
export declare class AdminUsersController {
    private readonly service;
    constructor(service: AdminUsersService);
    findAll(q: any): Promise<{
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
            profile: import("../auth/entities/user-profile.entity").UserProfile;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getRoles(): Promise<import("typeorm").ObjectLiteral[]>;
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
        profile: import("../auth/entities/user-profile.entity").UserProfile;
    }>;
    create(dto: any): Promise<{
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
        profile: import("../auth/entities/user-profile.entity").UserProfile;
    }>;
    update(id: string, dto: any): Promise<{
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
        profile: import("../auth/entities/user-profile.entity").UserProfile;
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
        profile: import("../auth/entities/user-profile.entity").UserProfile;
    }>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
