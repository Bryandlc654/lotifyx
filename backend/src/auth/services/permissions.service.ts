import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { RolePermission } from "../entities/role-permission.entity";

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
  ) {}

  async userHasPermission(roleName: string, requiredPerms: string[]): Promise<boolean> {
    if (!roleName || requiredPerms.length === 0) return true;
    if (roleName === "superadmin") return true;

    const role = await this.roleRepo.findOne({
      where: { name: roleName },
      relations: ["rolePermissions", "rolePermissions.permission"],
    });

    if (!role) return false;

    const userPerms = role.rolePermissions
      .filter(rp => rp.permission)
      .map(rp => rp.permission.name);

    return requiredPerms.some(p => userPerms.includes(p));
  }
}
