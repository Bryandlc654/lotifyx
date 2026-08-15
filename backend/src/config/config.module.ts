import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfig } from "./app-config.entity";
import { ConfigService } from "./config.service";

@Module({
  imports: [TypeOrmModule.forFeature([AppConfig])],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
