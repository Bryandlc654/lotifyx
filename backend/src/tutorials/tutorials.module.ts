import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TutorialController } from "./tutorial.controller";
import { TutorialService } from "./tutorial.service";
import { Tutorial } from "./tutorial.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Tutorial])],
  controllers: [TutorialController],
  providers: [TutorialService],
  exports: [TutorialService],
})
export class TutorialsModule {}
