import { User } from "./user.entity";
export declare class RefreshToken {
    id: string;
    token: string;
    expires_at: Date;
    is_revoked: boolean;
    user: User;
    user_id: string;
    created_at: Date;
}
