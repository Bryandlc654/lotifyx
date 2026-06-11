import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminRbacController } from "./admin-rbac.controller";
import { AdminRbacService } from "./admin-rbac.service";
import { User } from "../auth/entities/user.entity";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserVerification, Role, Permission, RolePermission])],
  controllers: [AdminUsersController, AdminRbacController],
  providers: [AdminUsersService, AdminRbacService],
})
export class AdminModule {}
