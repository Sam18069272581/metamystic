import { Controller, Get } from "@nestjs/common";
import type { ApiResponse } from "@metamystic/shared";
import { ok } from "../shared/api-response";

interface HealthPayload {
  service: "metamystic-backend";
  authCookiePolicy: "cross-site";
  ok: true;
}

@Controller("health")
export class HealthController {
  @Get()
  check(): ApiResponse<HealthPayload> {
    return ok({
      service: "metamystic-backend",
      authCookiePolicy: "cross-site",
      ok: true
    });
  }
}
