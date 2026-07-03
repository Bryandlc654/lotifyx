import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Request, Response } from "express";
import * as crypto from "crypto";

const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.headers?.[CSRF_HEADER] as string;

    if (!cookieToken) {
      const token = crypto.randomBytes(32).toString("hex");
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.setHeader(CSRF_HEADER, token);
      return true;
    }

    if (!headerToken || headerToken !== cookieToken) {
      throw new ForbiddenException("CSRF token inválido");
    }

    return true;
  }
}
