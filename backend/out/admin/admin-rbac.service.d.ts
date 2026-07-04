import { Repository } from "typeorm";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";
export declare class AdminRbacService {
    private readonly roleRepo;
    private readonly permRepo;
    private readonly rpRepo;
    constructor(roleRepo: Repository<Role>, permRepo: Repository<Permission>, rpRepo: Repository<RolePermission>);
    getRoles(): Promise<Role[]>;
    createRole(dto: {
        name: string;
        description?: string;
    }): Promise<Role>;
    deleteRole(id: string): Promise<{
        message: string;
    }>;
    getPermissions(): Promise<Permission[]>;
    createPermission(dto: {
        name: string;
        description: string;
        module: string;
    }): Promise<Permission>;
    deletePermission(id: string): Promise<{
        message: string;
    }>;
    getRolePermissions(roleId: string): Promise<RolePermission[]>;
    assignPermission(roleId: string, permissionId: string): Promise<RolePermission>;
    revokePermission(rolePermissionId: string): Promise<{
        message: string;
    }>;
    seedDefaultPermissions(): Promise<{
        message: string;
    }>;
}
