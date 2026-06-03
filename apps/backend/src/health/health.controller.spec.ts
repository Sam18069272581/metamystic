import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("returns a lightweight deployment health payload", () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: "success",
      data: {
        service: "metamystic-backend",
        ok: true
      }
    });
  });
});
