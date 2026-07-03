import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HelpController } from "./help.controller";
import { HelpService } from "./help.service";
import { HelpArticle } from "./help.entity";

@Module({
  imports: [TypeOrmModule.forFeature([HelpArticle])],
  controllers: [HelpController],
  providers: [HelpService],
  exports: [HelpService],
})
export class HelpModule {}
