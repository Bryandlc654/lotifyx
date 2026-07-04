import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { RolePermission } from "../entities/role-permission.entity";
export declare class PermissionsService {
    private readonly roleRepo;
    private readonly rpRepo;
    constructor(roleRepo: Repository<Role>, rpRepo: Repository<RolePermission>);
    userHasPermission(roleName: string, requiredPerms: string[]): Promise<boolean>;
}
