import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { RolesGuard } from "./guards/roles.guard";
import { User } from "./entities/user.entity";
import { Role } from "./entities/role.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { UserVerification } from "./entities/user-verification.entity";
import { CleanupService } from "../common/services/cleanup.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserProfile, RefreshToken, UserVerification]),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, RolesGuard, CleanupService],
  exports: [RolesGuard],
})
export class AuthModule {}
