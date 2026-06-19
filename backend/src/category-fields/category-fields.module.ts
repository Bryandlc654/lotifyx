import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoryFieldsController } from "./category-fields.controller";
import { CategoryFieldsService } from "./category-fields.service";
import { CategoryField } from "./category-field.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryField])],
  controllers: [CategoryFieldsController],
  providers: [CategoryFieldsService],
})
export class CategoryFieldsModule {}
