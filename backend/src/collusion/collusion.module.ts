import { Module } from "@nestjs/common";
import { CollusionService } from "./collusion.service";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [ConfigModule],
  providers: [CollusionService],
  exports: [CollusionService],
})
export class CollusionModule {}
