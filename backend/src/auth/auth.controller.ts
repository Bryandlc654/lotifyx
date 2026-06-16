import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  // ─── Google OAuth ───────────────────────────────────────

  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {
    // Guard redirige a Google
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken, user } =
      await this.authService.googleLogin(req.user);

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  }

  // ─── Refresh Token ──────────────────────────────────────

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  refresh(@Body("refreshToken") refreshToken: string) {
    return this.authService.refreshAccessToken(refreshToken);
  }

  // ─── Logout ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // ─── Profile ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req) {
    const user = await this.authService.getProfile(req.user.id);
    return {
      message: "Perfil obtenido exitosamente",
      user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  resendVerification(@Body("email") email: string) {
    return this.authService.resendVerification(email);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body("email") email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: { token: string; password: string }) {
    return this.authService.resetPassword(dto.token, dto.password);
  }
  @UseGuards(JwtAuthGuard)
  @Post("select-plan")
  @HttpCode(HttpStatus.OK)
  selectPlan(@Req() req, @Body("plan_id") planId: string) {
    return this.authService.selectPlan(req.user.id, planId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("bank-account")
  @HttpCode(HttpStatus.CREATED)
  saveBankAccount(@Req() req, @Body() dto: { bank_name: string; account_number: string }) {
    return this.authService.saveBankAccount(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("submit-payment")
  @HttpCode(HttpStatus.OK)
  submitPayment(@Req() req, @Body() dto: { operation_number: string; amount: number }) {
    return this.authService.submitPayment(req.user.id, dto);
  }
}
