import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import type { Response } from "express";
import type { ApiFailure } from "@metamystic/shared";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof body === "object" && body !== null && "message" in body
        ? String(Array.isArray(body.message) ? body.message.join("; ") : body.message)
        : exception instanceof Error
          ? exception.message
          : "Unexpected server error";

    const payload: ApiFailure = {
      status: "error",
      error: {
        code: exception instanceof HttpException ? exception.name : "InternalServerError",
        message
      }
    };

    response.status(status).json(payload);
  }
}
