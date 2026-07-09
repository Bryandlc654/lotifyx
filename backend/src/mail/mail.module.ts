import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { TaskQueueService } from "../common/services/task-queue.service";

@Global()
@Module({
  providers: [MailService, TaskQueueService],
  exports: [MailService, TaskQueueService],
})
export class MailModule {}
