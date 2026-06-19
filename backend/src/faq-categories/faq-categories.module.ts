import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FaqCategoriesController } from "./faq-categories.controller";
import { FaqCategoriesService } from "./faq-categories.service";
import { FaqCategory } from "./faq-category.entity";

@Module({
  imports: [TypeOrmModule.forFeature([FaqCategory])],
  controllers: [FaqCategoriesController],
  providers: [FaqCategoriesService],
})
export class FaqCategoriesModule {}
