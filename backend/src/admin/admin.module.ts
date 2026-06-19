import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminRbacController } from "./admin-rbac.controller";
import { AdminRbacService } from "./admin-rbac.service";
import { AdminProductsController } from "./admin-products.controller";
import { ProductsModule } from "../products/products.module";
import { User } from "../auth/entities/user.entity";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserVerification, Role, Permission, RolePermission]), ProductsModule],
  controllers: [AdminUsersController, AdminRbacController, AdminProductsController],
  providers: [AdminUsersService, AdminRbacService],
})
export class AdminModule {}
