import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SecondaryBannersController } from "./secondary-banners.controller";
import { SecondaryBannersService } from "./secondary-banners.service";
import { SecondaryBanner } from "./secondary-banner.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SecondaryBanner])],
  controllers: [SecondaryBannersController],
  providers: [SecondaryBannersService],
})
export class SecondaryBannersModule {}
