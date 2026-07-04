import { User } from "./user.entity";
export declare class UserVerification {
    id: string;
    user: User;
    user_id: string;
    verification_type: string;
    verification_status: string;
    provider: string;
    request_payload: Record<string, any>;
    response_payload: Record<string, any>;
    verified_data: Record<string, any>;
    verified_at: Date;
    created_at: Date;
}
