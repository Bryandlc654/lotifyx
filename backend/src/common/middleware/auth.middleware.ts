import { Injectable, NestMiddleware } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token);
        (req as any).user = { id: payload.sub, email: payload.email };
      } catch {
        // Token inválido o expirado — no bloquea, simplemente no setea user
      }
    }

    next();
  }
}
