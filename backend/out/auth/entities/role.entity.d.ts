import { User } from "./user.entity";
import { RolePermission } from "./role-permission.entity";
export declare class Role {
    id: string;
    name: string;
    description: string;
    is_admin: boolean;
    created_at: Date;
    users: User[];
    rolePermissions: RolePermission[];
}
