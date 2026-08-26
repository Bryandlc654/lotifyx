import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminRbacController } from "./admin-rbac.controller";
import { AdminRbacService } from "./admin-rbac.service";
import { AdminProductsController } from "./admin-products.controller";
import { AdminLotsController } from "./admin-lots.controller";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminDashboardController } from "./admin-dashboard.controller";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { AdminReviewsController } from "./admin-reviews.controller";
import { AdminAuctionsController } from "./admin-auctions.controller";
import { AdminVerificationsController } from "./admin-verifications.controller";
import { AdminConfigController } from "./admin-config.controller";
import { MessagesModule } from "../messages/messages.module";
import { AdminCollusionController } from "./admin-collusion.controller";
import { AdminRequestsController } from "./admin-requests.controller";
import { ProductsModule } from "../products/products.module";
import { LotsModule } from "../lots/lots.module";
import { CheckoutModule } from "../checkout/checkout.module";
import { AuditModule } from "../audit/audit.module";
import { VerificationsModule } from "../verifications/verifications.module";
import { ConfigModule } from "../config/config.module";
import { CollusionModule } from "../collusion/collusion.module";
import { RequestsModule } from "../requests/requests.module";
import { User } from "../auth/entities/user.entity";
import { UserProfile } from "../auth/entities/user-profile.entity";
import { UserVerification } from "../auth/entities/user-verification.entity";
import { Role } from "../auth/entities/role.entity";
import { Permission } from "../auth/entities/permission.entity";
import { RolePermission } from "../auth/entities/role-permission.entity";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, UserVerification, Role, Permission, RolePermission]), ProductsModule, LotsModule, CheckoutModule, AuditModule, VerificationsModule, ConfigModule, CollusionModule, RequestsModule, MessagesModule],
  controllers: [AdminUsersController, AdminRbacController, AdminProductsController, AdminLotsController, AdminOrdersController, AdminDashboardController, AdminWithdrawalsController, AdminReviewsController, AdminAuctionsController, AdminVerificationsController, AdminConfigController, AdminCollusionController, AdminRequestsController],
  providers: [AdminUsersService, AdminRbacService],
})
export class AdminModule {}
