import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { BaziService } from "./bazi.service";

describe("BaziService authenticated chart creation", () => {
  it("rejects creating a chart for another user's profile", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-1", userId: "other-user" })
      }
    };
    const service = new BaziService(prisma as never, {} as never);

    await expect(service.createUserChart("user-1", "profile-1")).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe("BaziService chart fingerprinting", () => {
  const profile = {
    id: "profile-1",
    birthTime: new Date("1995-05-20T10:30:00.000Z"),
    birthTimezone: "Asia/Shanghai",
    gender: "female"
  };

  const existingChart = {
    id: "bazi-existing",
    profileId: "profile-1",
    dayMaster: "乙",
    dayMasterStatus: "weak",
    mainPattern: "杀印相生",
    pillars: {
      year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬", "甲"], nayin: "山头火" },
      month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙", "庚"], nayin: "白蜡金" },
      day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"], nayin: "大溪水" },
      hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙", "庚"], nayin: "白蜡金" }
    },
    elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
    metadata: { usefulGods: ["water", "wood"], analysis: { strengthLabel: "身弱" } },
    createdAt: new Date("2026-06-02T08:00:00.000Z")
  };

  it("reuses an existing chart with the same birth fingerprint", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue(profile)
      },
      baziChart: {
        findUnique: vi.fn().mockResolvedValue(existingChart),
        create: vi.fn()
      }
    };
    const engine = {
      calculate: vi.fn()
    };
    const service = new BaziService(prisma as never, engine as never);

    const chart = await service.createChart("profile-1");

    expect(chart.id).toBe("bazi-existing");
    expect(engine.calculate).not.toHaveBeenCalled();
    expect(prisma.baziChart.create).not.toHaveBeenCalled();
  });

  it("stores a deterministic fingerprint when creating a new chart", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue(profile)
      },
      baziChart: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: "bazi-new",
            profileId: data.profileId,
            dayMaster: data.dayMaster,
            dayMasterStatus: data.dayMasterStatus,
            mainPattern: data.mainPattern,
            pillars: data.pillars,
            elements: data.elements,
            metadata: data.metadata,
            createdAt: new Date("2026-06-02T08:00:00.000Z")
          })
        )
      }
    };
    const engine = {
      calculate: vi.fn().mockReturnValue({
        profileId: "profile-1",
        dayMaster: "乙",
        dayMasterStatus: "weak",
        mainPattern: "杀印相生",
        pillars: existingChart.pillars,
        elements: existingChart.elements,
        metadata: {}
      })
    };
    const service = new BaziService(prisma as never, engine as never);

    await service.createChart("profile-1");

    const createInput = prisma.baziChart.create.mock.calls[0]?.[0];
    expect(createInput.data.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(createInput.data.fingerprint).toBe(
      "9089e31ef50ed682be6ef8bcdf90155ae55a16bf95901842938271a3857353da"
    );
  });
});
