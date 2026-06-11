import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { UserVerification } from "./entities/user-verification.entity";
import { Role } from "./entities/role.entity";
import { MailService } from "../mail/mail.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(UserVerification)
    private readonly verificationRepository: Repository<UserVerification>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  // ─── Helpers ──────────────────────────────────────────────

  private generateReferralCode(): string {
    return crypto.randomBytes(5).toString("hex").toUpperCase();
  }

  private generateRefreshTokenValue(): string {
    return crypto.randomBytes(48).toString("hex");
  }

  private async generateTokens(user: User) {
    const role = user.role
      ? typeof user.role === "string"
        ? user.role
        : (user.role as any).name
      : null;

    const isAdmin = user.role ? !!(user.role as any).is_admin : false;

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role,
      isAdmin,
    });

    const refreshValue = this.generateRefreshTokenValue();

    const refresh = this.refreshTokenRepository.create({
      token: crypto.createHash("sha256").update(refreshValue).digest("hex"),
      user_id: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    });

    await this.refreshTokenRepository.save(refresh);

    return { accessToken, refreshToken: `${refresh.id}.${refreshValue}` };
  }

  private async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
  }) {
    let user = await this.userRepository.findOne({
      where: { email: profile.email },
      relations: ["profile"],
    });

    if (!user) {
      const nameParts = profile.name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      user = this.userRepository.create({
        email: profile.email,
        password_hash: "",
        provider: "google",
        is_verified: true,
        status: "active",
        referral_code: this.generateReferralCode(),
      });

      const savedUser = await this.userRepository.save(user);

      const userProfile = this.profileRepository.create({
        user_id: savedUser.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: profile.picture ?? undefined,
      });

      await this.profileRepository.save(userProfile);
      savedUser.profile = userProfile;
      user = savedUser;
    }

    return user;
  }

  // ─── Register ─────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.correo },
    });

    if (existingUser) {
      throw new ConflictException("El correo ya está registrado");
    }

    if (dto.ruc) {
      const existingRuc = await this.profileRepository.findOne({
        where: { ruc: dto.ruc },
      });
      if (existingRuc) {
        throw new ConflictException("El RUC ya está registrado");
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.contrasena, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    let roleId: string | undefined;
    if (dto.accountType) {
      const roleName = dto.accountType === "Quiero vender" ? "vendedor" : "comprador";
      let role = await this.roleRepository.findOne({ where: { name: roleName } });
      if (!role) {
        role = await this.roleRepository.save(
          this.roleRepository.create({ name: roleName, description: `Rol automático: ${dto.accountType}` })
        );
      }
      roleId = role.id;
    }

    let referredBy: string | undefined;
    if (dto.codigoReferidos) {
      const referrer = await this.userRepository.findOne({
        where: { referral_code: dto.codigoReferidos },
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    try {
      const user = this.userRepository.create({
        email: dto.correo,
        password_hash: hashedPassword,
        phone: dto.telefono,
        role_id: roleId,
        status: "active",
        referral_code: this.generateReferralCode(),
        referred_by: referredBy,
        is_verified: false,
      });

      const savedUser = await this.userRepository.save(user);

      // Crear registro de verificación
      const verification = this.verificationRepository.create({
        user_id: savedUser.id,
        verification_type: "email",
        verification_status: "pending",
        request_payload: { email: dto.correo },
        response_payload: {
          code: verificationCode,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      });

      await this.verificationRepository.save(verification);

      const profile = this.profileRepository.create({
        user_id: savedUser.id,
        first_name: dto.nombre,
        last_name: dto.apellidos,
        birth_date: dto.fechaNacimiento,
        document_type: "DNI",
        document_number: dto.dni,
        how_found_us: dto.comoNosEncontraste,
        ruc: dto.ruc,
        razon_social: dto.razonSocial,
        account_type: dto.accountType,
      });

      await this.profileRepository.save(profile);

      // Enviar email (no bloquea el registro si falla)
      this.mailService
        .sendVerificationCode(dto.correo, verificationCode, dto.nombre)
        .catch(() => {});

      return {
        message: "Registro exitoso. Revisa tu correo para verificar tu cuenta.",
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      if (error.code === "23505") {
        throw new ConflictException("Uno de los datos ya está registrado (correo, RUC o DNI)");
      }
      throw new InternalServerErrorException("Error al registrar el usuario");
    }
  }

  // ─── Verify Email ─────────────────────────────────────────

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException("Usuario no encontrado");
    }

    if (user.is_verified) {
      return { message: "La cuenta ya está verificada" };
    }

    const verification = await this.verificationRepository.findOne({
      where: {
        user_id: user.id,
        verification_type: "email",
        verification_status: "pending",
      },
      order: { created_at: "DESC" },
    });

    if (!verification) {
      throw new BadRequestException("No hay verificación pendiente. Solicita un nuevo código.");
    }

    const storedCode = verification.response_payload?.code;
    const expiresAt = verification.response_payload?.expires_at;

    if (storedCode !== dto.code) {
      throw new BadRequestException("Código de verificación inválido");
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      throw new BadRequestException("El código de verificación expiró. Solicita uno nuevo.");
    }

    verification.verification_status = "verified";
    verification.verified_at = new Date();
    verification.verified_data = { email: dto.email };
    await this.verificationRepository.save(verification);

    user.is_verified = true;
    await this.userRepository.save(user);

    return { message: "Cuenta verificada exitosamente. Ya puedes iniciar sesión." };
  }

  // ─── Login ────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [{ email: dto.credential }, { phone: dto.credential }],
      relations: ["profile", "role"],
    });

    if (!user) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.contrasena,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales inválidas");
    }

    if (!user.is_verified) {
      throw new UnauthorizedException(
        "Cuenta no verificada. Revisa tu correo para verificar tu cuenta."
      );
    }

    const { password_hash: _, ...result } = user;
    const tokens = await this.generateTokens(user);

    return {
      message: "Inicio de sesión exitoso",
      ...tokens,
      user: result,
    };
  }

  // ─── Google OAuth ─────────────────────────────────────────

  async googleLogin(profile: {
    googleId: string;
    email: string;
    name: string;
    picture: string | null;
  }) {
    const user = await this.findOrCreateGoogleUser(profile);
    const { password_hash: _, ...result } = user;
    const tokens = await this.generateTokens(user);

    return {
      message: "Inicio de sesión con Google exitoso",
      ...tokens,
      user: result,
    };
  }

  // ─── Refresh Token ────────────────────────────────────────

  async refreshAccessToken(refreshToken: string) {
    const [id, value] = refreshToken.split(".");

    if (!id || !value) {
      throw new UnauthorizedException("Refresh token inválido");
    }

    const hashedValue = crypto.createHash("sha256").update(value).digest("hex");

    const stored = await this.refreshTokenRepository.findOne({
      where: {
        id,
        token: hashedValue,
        is_revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ["user", "user.profile"],
    });

    if (!stored) {
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }

    // Rotación: revocar el token usado y emitir uno nuevo
    stored.is_revoked = true;
    await this.refreshTokenRepository.save(stored);

    const user = stored.user;
    const { password_hash: _, ...result } = user;
    const tokens = await this.generateTokens(user);

    return {
      message: "Token renovado exitosamente",
      ...tokens,
      user: result,
    };
  }

  // ─── Logout ───────────────────────────────────────────────

  async logout(refreshToken: string) {
    const [id] = refreshToken.split(".");
    if (id) {
      await this.refreshTokenRepository.update(id, { is_revoked: true });
    }
    return { message: "Sesión cerrada exitosamente" };
  }

  // ─── Profile ──────────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["profile", "role"],
    });

    if (!user) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    const { password_hash: _, ...result } = user;
    return result;
  }

  // ─── Select Plan ─────────────────────────────────────────

  async selectPlan(userId: string, planId: string) {
    await this.profileRepository.update({ user_id: userId }, { plan_id: planId });
    return { message: "Plan activado exitosamente" };
  }
}
