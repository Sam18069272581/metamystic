import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";
import { createAiAccessPolicyStub } from "./ai-access-policy.stub";

describe("ConsultationService idempotency", () => {
  it("returns an existing consultation for the same owner and idempotency key", async () => {
    const existing = {
      id: "consult-1", profileId: "profile-1", chartId: "chart-1", question: "今年适合换工作吗？",
      tone: "strategic", status: "pending", summary: null, createdAt: new Date("2026-06-22T00:00:00.000Z")
    };
    const prisma = {
      profile: { findUnique: vi.fn().mockResolvedValue({ id: "profile-1", userId: "user-1", user: { email: "u@example.com", anonymousUserId: null } }) },
      baziChart: { findUnique: vi.fn().mockResolvedValue({ id: "chart-1", profileId: "profile-1" }) },
      consultation: {
        findUnique: vi.fn().mockResolvedValue(existing),
        create: vi.fn()
      }
    };
    const service = new ConsultationService(
      prisma as never,
      { evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "仅供参考" }) } as never,
      {} as never, {} as never, {} as never, createAiAccessPolicyStub() as never
    );

    const result = await service.createUserConsultation("user-1", {
      profileId: "profile-1", chartId: "chart-1", question: "今年适合换工作吗？", tone: "strategic",
      idempotencyKey: "8a4a4f6d-19c7-4b12-8784-e2c31bb8d6a4"
    });

    expect(result.id).toBe("consult-1");
    expect(prisma.consultation.create).not.toHaveBeenCalled();
  });
});
