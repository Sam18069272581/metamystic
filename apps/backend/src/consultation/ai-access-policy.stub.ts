import { vi } from "vitest";

const access = {
  mode: "public_beta" as const,
  charged: false,
  remaining: 29,
  resetsAt: "2026-06-23T00:00:00.000Z"
};

export function createAiAccessPolicyStub() {
  return {
    preview: vi.fn().mockResolvedValue(access),
    assertAvailable: vi.fn().mockResolvedValue(access),
    consume: vi.fn().mockResolvedValue(access)
  };
}
