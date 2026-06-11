import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import { RolePermission } from "../entities/role-permission.entity";
import { Role } from "../entities/role.entity";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rpRepo: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPerms || requiredPerms.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new ForbiddenException("Acceso denegado");

    // If user has role info from JWT, find the role and its permissions
    const role = await this.roleRepo.findOne({
      where: { name: user.role },
      relations: ["rolePermissions", "rolePermissions.permission"],
    });

    if (!role) throw new ForbiddenException("Rol no encontrado");

    const userPerms = role.rolePermissions
      .filter(rp => rp.permission)
      .map(rp => rp.permission.name);

    const hasPermission = requiredPerms.some(p => userPerms.includes(p));

    if (!hasPermission) {
      throw new ForbiddenException("No tienes permisos para esta acción");
    }

    return true;
  }
}
