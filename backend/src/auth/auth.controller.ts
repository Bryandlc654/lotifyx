import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";
import { Throttle } from "@nestjs/throttler";
import { AuthGuard } from "@nestjs/passport";
import { Response } from "express";
import * as crypto from "crypto";
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
  register(@Body() dto: RegisterDto, @Req() req: any) {
    const referralFromCookie = req.cookies?.referral_code;
    if (referralFromCookie && !dto.codigoReferidos) {
      dto.codigoReferidos = referralFromCookie;
    }
    return this.authService.register(dto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProd ? "none" : "lax",
      path: "/api/auth/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user, message: result.message };
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

  // ─── CSRF Token ─────────────────────────────────────────

  @Get("csrf-token")
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie("csrf_token", token, {
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return { csrfToken: token };
  }

  // ─── Referral Tracking ─────────────────────────────────

  @Get("set-referral")
  setReferral(@Query("ref") ref: string, @Res({ passthrough: true }) res: Response) {
    if (ref) {
      res.cookie("referral_code", ref, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    return { message: "Referral guardado" };
  }

  // ─── Refresh Token ──────────────────────────────────────

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Body("refreshToken") bodyToken: string, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || bodyToken;
    if (!refreshToken) throw new UnauthorizedException("Refresh token no encontrado");
    const result = await this.authService.refreshAccessToken(refreshToken);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProd ? "none" : "lax",
      path: "/api/auth/",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: result.accessToken, refreshToken: result.refreshToken, message: "Token renovado" };
  }

  // ─── Logout ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Body("refreshToken") bodyToken: string, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken || bodyToken;
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie("refreshToken", { path: "/api/auth/" });
    return { message: "Sesión cerrada" };
  }

  // ─── Profile ────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req) {
    const user = await this.authService.getProfile(req.user.id);
    return { message: "Perfil obtenido exitosamente", user };
  }

  @UseGuards(JwtAuthGuard)
  @Put("me")
  @HttpCode(HttpStatus.OK)
  async updateProfile(@Req() req, @Body() dto: any) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post("avatar")
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor("avatar", {
    storage: diskStorage({
      destination: "./uploads",
      filename: (_req, file, cb) => { cb(null, `avatar-${Date.now()}-${Math.round(Math.random()*1e9)}${extname(file.originalname)}`); },
    }),
  }))
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/${file.filename}`;
    await this.authService.updateProfile(req.user.id, { avatar_url: url });
    return { url };
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
  @Get("bank-accounts")
  getBankAccounts(@Req() req) {
    return this.authService.getBankAccounts(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("bank-account")
  @HttpCode(HttpStatus.CREATED)
  saveBankAccount(@Req() req, @Body() dto: { bank_name: string; account_number: string; account_holder?: string; account_type?: string }) {
    return this.authService.saveBankAccount(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put("bank-account/:id")
  @HttpCode(HttpStatus.OK)
  updateBankAccount(@Req() req, @Param("id") id: string, @Body() dto: { bank_name?: string; account_number?: string; account_holder?: string; account_type?: string }) {
    return this.authService.updateBankAccount(req.user.id, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("bank-account/:id")
  @HttpCode(HttpStatus.OK)
  deleteBankAccount(@Req() req, @Param("id") id: string) {
    return this.authService.deleteBankAccount(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("submit-payment")
  @UseInterceptors(
    FileInterceptor("proof", {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = "./uploads/proofs";
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\//)) {
          cb(new BadRequestException("Solo se permiten imágenes"), false);
          return;
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @HttpCode(HttpStatus.OK)
  submitPayment(
    @Req() req,
    @Body() body: { operation_number: string; amount: string; origin_account_id?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("El comprobante es obligatorio");
    const proofUrl = `/uploads/proofs/${file.filename}`;
    return this.authService.submitPayment(req.user.id, {
      operation_number: body.operation_number,
      amount: parseFloat(body.amount),
      proof_url: proofUrl,
      origin_account_id: body.origin_account_id,
    });
  }
}
