import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BackingController } from "./backing.controller";
import { BackingService } from "./backing.service";
import { BackingLogo } from "./backing-logo.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BackingLogo])],
  controllers: [BackingController],
  providers: [BackingService],
})
export class BackingModule {}
