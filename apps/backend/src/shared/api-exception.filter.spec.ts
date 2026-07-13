import { HttpException, HttpStatus } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ApiExceptionFilter } from "./api-exception.filter";

function createHost(requestId = "req-123") {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
  const request = {
    headers: { "x-request-id": requestId },
    method: "POST",
    originalUrl: "/api/v1/users/me/profiles"
  };
  return {
    response,
    host: {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request
      })
    }
  };
}

describe("ApiExceptionFilter", () => {
  it("does not expose internal exception messages", () => {
    const { host, response } = createHost();

    new ApiExceptionFilter().catch(
      new Error("Invalid prisma.profile.create() invocation: Unique constraint failed on userId"),
      host as never
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "服务暂时不可用，请稍后重试。",
        details: { requestId: "req-123" }
      }
    });
  });

  it("preserves safe validation messages", () => {
    const { host, response } = createHost();

    new ApiExceptionFilter().catch(
      new HttpException({ message: ["email must be valid", "password is required"] }, HttpStatus.BAD_REQUEST),
      host as never
    );

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: "email must be valid; password is required"
        })
      })
    );
  });

  it("preserves a stable public error code and merges the request id", () => {
    const { host, response } = createHost();

    new ApiExceptionFilter().catch(
      new HttpException(
        {
          code: "AI_RATE_LIMITED",
          message: "公测额度已用完，请稍后再试。",
          details: { resetsAt: "2026-07-14T00:00:00.000Z" }
        },
        HttpStatus.TOO_MANY_REQUESTS
      ),
      host as never
    );

    expect(response.json).toHaveBeenCalledWith({
      status: "error",
      error: {
        code: "AI_RATE_LIMITED",
        message: "公测额度已用完，请稍后再试。",
        details: {
          resetsAt: "2026-07-14T00:00:00.000Z",
          requestId: "req-123"
        }
      }
    });
  });
});
