import { Role } from "./role.entity";
import { Permission } from "./permission.entity";
export declare class RolePermission {
    id: string;
    role_id: string;
    permission_id: string;
    role: Role;
    permission: Permission;
    created_at: Date;
}
