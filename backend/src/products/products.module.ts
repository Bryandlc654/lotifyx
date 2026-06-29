import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { Product } from "./product.entity";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [TypeOrmModule.forFeature([Product]), AuditModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
