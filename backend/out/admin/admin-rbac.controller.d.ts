import { AdminRbacService } from "./admin-rbac.service";
export declare class AdminRbacController {
    private readonly service;
    constructor(service: AdminRbacService);
    getRoles(): Promise<import("../auth/entities/role.entity").Role[]>;
    createRole(dto: any): Promise<import("../auth/entities/role.entity").Role>;
    deleteRole(id: string): Promise<{
        message: string;
    }>;
    getPermissions(): Promise<import("../auth/entities/permission.entity").Permission[]>;
    createPermission(dto: any): Promise<import("../auth/entities/permission.entity").Permission>;
    deletePermission(id: string): Promise<{
        message: string;
    }>;
    getRolePermissions(roleId: string): Promise<import("../auth/entities/role-permission.entity").RolePermission[]>;
    assignPermission(roleId: string, permId: string): Promise<import("../auth/entities/role-permission.entity").RolePermission>;
    revokePermission(id: string): Promise<{
        message: string;
    }>;
    seed(): Promise<{
        message: string;
    }>;
}
