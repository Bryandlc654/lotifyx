import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    if (err) throw err;
    if (!user) {
      throw new UnauthorizedException(
        info?.name === "TokenExpiredError"
          ? "Tu sesión expiró. Inicia sesión nuevamente."
          : "No autorizado. Inicia sesión nuevamente."
      );
    }
    return user;
  }
}
