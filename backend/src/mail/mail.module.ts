import { Global, Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { TaskQueueService } from "../common/services/task-queue.service";
import { DatabaseService } from "../common/services/database.service";

@Global()
@Module({
  providers: [MailService, TaskQueueService, DatabaseService],
  exports: [MailService, TaskQueueService, DatabaseService],
})
export class MailModule {}
