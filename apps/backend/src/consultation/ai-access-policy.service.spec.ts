import { ConfigService } from "@nestjs/config";
import { describe, expect, it, vi } from "vitest";
import { AiAccessPolicyService } from "./ai-access-policy.service";

describe("AiAccessPolicyService", () => {
  it("offers five free daily consultations to anonymous users by default", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ used: 2 }]) };
    const service = new AiAccessPolicyService(prisma as never, new ConfigService());

    const access = await service.preview({
      userId: "anonymous-user-1",
      ownerType: "anonymous",
      now: new Date("2026-07-13T10:15:30.000Z")
    });

    expect(access).toEqual({
      mode: "public_beta",
      charged: false,
      remaining: 3,
      resetsAt: "2026-07-14T00:00:00.000Z"
    });
  });

  it("uses the configured registered-user limit", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ used: 7 }]) };
    const config = new ConfigService({ AI_PUBLIC_BETA_USER_DAILY_LIMIT: "40" });
    const service = new AiAccessPolicyService(prisma as never, config);

    const access = await service.preview({
      userId: "user-1",
      ownerType: "user",
      now: new Date("2026-07-13T10:15:30.000Z")
    });

    expect(access.remaining).toBe(33);
  });

  it("atomically consumes daily and minute usage windows", async () => {
    const tx = {
      $queryRaw: vi.fn().mockResolvedValueOnce([{ used: 3 }]).mockResolvedValueOnce([{ used: 1 }])
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    };
    const service = new AiAccessPolicyService(prisma as never, new ConfigService());

    const access = await service.consume({
      userId: "anonymous-user-1",
      ownerType: "anonymous",
      now: new Date("2026-07-13T10:15:30.000Z")
    });

    expect(tx.$queryRaw).toHaveBeenCalledTimes(2);
    expect(access.remaining).toBe(2);
    expect(access.charged).toBe(false);
  });

  it("rejects public-beta usage when a window is exhausted", async () => {
    const tx = { $queryRaw: vi.fn().mockResolvedValueOnce([]) };
    const prisma = {
      $transaction: vi.fn(async (work: (client: typeof tx) => unknown) => work(tx))
    };
    const service = new AiAccessPolicyService(prisma as never, new ConfigService());

    await expect(service.consume({
      userId: "anonymous-user-1",
      ownerType: "anonymous",
      now: new Date("2026-07-13T10:15:30.000Z")
    })).rejects.toMatchObject({
      code: "AI_RATE_LIMITED",
      resetsAt: "2026-07-14T00:00:00.000Z"
    });
  });

  it("keeps future metered access behind the same policy boundary", async () => {
    const service = new AiAccessPolicyService(
      { $queryRaw: vi.fn() } as never,
      new ConfigService({ AI_ACCESS_MODE: "metered" })
    );

    await expect(service.preview({
      userId: "user-1",
      ownerType: "user",
      now: new Date("2026-07-13T10:15:30.000Z")
    })).rejects.toMatchObject({ code: "AI_PLAN_REQUIRED" });
  });
});
