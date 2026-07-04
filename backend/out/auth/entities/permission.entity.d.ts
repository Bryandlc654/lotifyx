import { RolePermission } from "./role-permission.entity";
export declare class Permission {
    id: string;
    name: string;
    description: string;
    module: string;
    created_at: Date;
    rolePermissions: RolePermission[];
}
