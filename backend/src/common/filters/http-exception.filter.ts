import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = exception instanceof HttpException
      ? exception.getResponse()
      : { message: "Error interno del servidor" };

    const message = typeof errorResponse === "string"
      ? errorResponse
      : (errorResponse as any).message || "Error interno del servidor";

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status} - ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : "",
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
