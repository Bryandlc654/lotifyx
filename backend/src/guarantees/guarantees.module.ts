import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { GuaranteesService } from "./guarantees.service";
import { GuaranteesController } from "./guarantees.controller";

@Module({
  imports: [ConfigModule],
  providers: [GuaranteesService],
  controllers: [GuaranteesController],
  exports: [GuaranteesService],
})
export class GuaranteesModule {}
