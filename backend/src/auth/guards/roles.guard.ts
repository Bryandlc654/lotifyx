import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException("Acceso denegado");
    }

    // If endpoint requires superadmin/admin, check is_admin flag from token
    if (requiredRoles.includes("superadmin") || requiredRoles.includes("admin")) {
      if (user.isAdmin || user.role === "superadmin") {
        return true;
      }
      throw new ForbiddenException("No tienes permisos de administrador");
    }

    const hasRole = requiredRoles.some((role) => user.role === role);

    if (!hasRole) {
      throw new ForbiddenException("No tienes permisos para esta acción");
    }

    return true;
  }
}
