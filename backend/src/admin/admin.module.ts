import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { User } from "../auth/entities/user.entity";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserVerification])],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminModule {}
