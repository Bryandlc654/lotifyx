import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminRbacController } from "./admin-rbac.controller";
import { AdminRbacService } from "./admin-rbac.service";
import { AdminProductsController } from "./admin-products.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { AdminReviewsController } from "./admin-reviews.controller";
import { AdminAuctionsController } from "./admin-auctions.controller";
import { ProductsModule } from "../products/products.module";
import { CheckoutModule } from "../checkout/checkout.module";
import { AuditModule } from "../audit/audit.module";
import { ReviewsModule } from "../reviews/reviews.module";
import { AuctionsModule } from "../auctions/auctions.module";
import { User } from "../auth/entities/user.entity";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserVerification, Role, Permission, RolePermission]), ProductsModule, CheckoutModule, AuditModule, ReviewsModule, AuctionsModule],
  controllers: [AdminUsersController, AdminRbacController, AdminProductsController, AdminOrdersController, AdminDashboardController, AdminWithdrawalsController, AdminReviewsController, AdminAuctionsController],
  providers: [AdminUsersService, AdminRbacService],
})
export class AdminModule {}
