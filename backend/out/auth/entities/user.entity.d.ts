import { Role } from "./role.entity";
import { UserProfile } from "./user-profile.entity";
export declare class User {
    id: string;
    role: Role;
    role_id: string;
    email: string;
    password_hash: string;
    phone: string;
    provider: string;
    is_verified: boolean;
    status: string;
    referral_code: string;
    referred_by: string;
    created_at: Date;
    updated_at: Date;
    profile: UserProfile;
}
