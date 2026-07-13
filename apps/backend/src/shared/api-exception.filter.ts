import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { ApiFailure } from "@metamystic/shared";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const headerRequestId = request.headers["x-request-id"];
    const requestId = (Array.isArray(headerRequestId) ? headerRequestId[0] : headerRequestId) || randomUUID();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const publicMessage =
      typeof body === "object" && body !== null && "message" in body
        ? String(Array.isArray(body.message) ? body.message.join("; ") : body.message)
        : status >= HttpStatus.INTERNAL_SERVER_ERROR
          ? "服务暂时不可用，请稍后重试。"
          : "请求处理失败。";
    const publicCode =
      typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
        ? body.code
        : exception instanceof HttpException
          ? exception.name
          : "INTERNAL_SERVER_ERROR";
    const publicDetails =
      status < HttpStatus.INTERNAL_SERVER_ERROR &&
      typeof body === "object" && body !== null && "details" in body &&
      typeof body.details === "object" && body.details !== null && !Array.isArray(body.details)
        ? (body.details as Record<string, unknown>)
        : {};

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const internalMessage = exception instanceof Error ? exception.stack ?? exception.message : String(exception);
      this.logger.error(`${request.method} ${request.originalUrl} requestId=${requestId}`, internalMessage);
    }

    const payload: ApiFailure = {
      status: "error",
      error: {
        code: publicCode,
        message: publicMessage,
        details: { ...publicDetails, requestId }
      }
    };

    response.status(status).json(payload);
  }
}
