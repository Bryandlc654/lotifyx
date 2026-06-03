import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MarqueesController } from "./marquees.controller";
import { MarqueesService } from "./marquees.service";
import { Marquee } from "./marquee.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Marquee])],
  controllers: [MarqueesController],
  providers: [MarqueesService],
})
export class MarqueesModule {}
