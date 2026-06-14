import { describe, expect, it, vi } from "vitest";
import { loadAccountData } from "./account-load";

describe("loadAccountData", () => {
  it("keeps the authenticated user visible when secondary account resources fail", async () => {
    const api = {
      me: vi.fn().mockResolvedValue({
        id: "user-1",
        email: "user@example.com",
        role: "USER",
        createdAt: "2026-06-14T00:00:00.000Z"
      }),
      listMyCharts: vi.fn().mockRejectedValue(new Error("charts failed")),
      listMyProfiles: vi.fn().mockResolvedValue({ profiles: [], defaultProfileId: undefined }),
      listMyCompatibilityReadings: vi.fn().mockRejectedValue(new Error("compatibility failed"))
    };

    const result = await loadAccountData(api);

    expect(result.user.email).toBe("user@example.com");
    expect(result.profiles?.profiles).toEqual([]);
    expect(result.compatibilityHistory).toEqual([]);
    expect(result.error).toContain("charts failed");
  });
});
