import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

interface Task {
  name: string;
  handler: () => Promise<void>;
  retries: number;
  maxRetries: number;
}

@Injectable()
export class TaskQueueService {
  private readonly logger = new Logger(TaskQueueService.name);
  private queue: Task[] = [];
  private processing = false;

  enqueue(name: string, handler: () => Promise<void>, maxRetries = 3) {
    this.queue.push({ name, handler, retries: 0, maxRetries });
  }

  get pending(): number {
    return this.queue.length;
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const task = this.queue.shift()!;
    try {
      await task.handler();
    } catch (e: any) {
      if (task.retries < task.maxRetries) {
        this.queue.push({ ...task, retries: task.retries + 1 });
        this.logger.warn(`[${task.name}] falló (intento ${task.retries + 1}/${task.maxRetries}), re-encolado`);
      } else {
        this.logger.error(`[${task.name}] falló tras ${task.maxRetries} intentos: ${e.message}`);
      }
    } finally {
      this.processing = false;
    }
  }

  getStats() {
    return { pending: this.queue.length, processing: this.processing };
  }
}
