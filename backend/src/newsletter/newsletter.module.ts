import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsletterController } from "./newsletter.controller";
import { NewsletterService } from "./newsletter.service";
import { NewsletterSubscriber } from "./newsletter.entity";

@Module({
  imports: [TypeOrmModule.forFeature([NewsletterSubscriber])],
  controllers: [NewsletterController],
  providers: [NewsletterService],
  exports: [NewsletterService],
})
export class NewsletterModule {}
