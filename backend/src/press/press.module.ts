import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PressController } from "./press.controller";
import { PressService } from "./press.service";
import { PressArticle } from "./press.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PressArticle])],
  controllers: [PressController],
  providers: [PressService],
  exports: [PressService],
})
export class PressModule {}
