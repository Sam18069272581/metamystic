import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService stream execution", () => {
  it("shares one model execution across concurrent subscribers", async () => {
    const now = new Date("2026-06-22T00:00:00.000Z");
    const record = {
      id: "consult-1", userId: "user-1", profileId: "profile-1", chartId: "chart-1",
      question: "今年适合换工作吗？", tone: "strategic", status: "pending", summary: null, createdAt: now,
      chart: {
        id: "chart-1", profileId: "profile-1", dayMaster: "乙", dayMasterStatus: "balanced", mainPattern: "杀印相生",
        pillars: {
          year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: [] },
          month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [] },
          day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: [] },
          hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [] }
        },
        elements: { wood: 0.3, fire: 0.2, earth: 0.1, metal: 0.25, water: 0.15 }, createdAt: now
      }
    } as const;
    const provider = {
      streamConsultation: vi.fn(async function* () {
        await new Promise((resolve) => setTimeout(resolve, 5));
        yield { section: "verdict" as const, content: "小步验证" };
      })
    };
    const prisma = {
      consultation: { findFirst: vi.fn().mockResolvedValue(record), update: vi.fn().mockResolvedValue({}) },
      consultationMessage: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (operations: unknown[]) => operations)
    };
    const service = new ConsultationService(
      prisma as never,
      { evaluateQuestion: vi.fn().mockReturnValue({ allowed: true, disclaimer: "仅供参考" }) } as never,
      { search: vi.fn().mockResolvedValue({ chunks: [] }) } as never,
      provider as never,
      { rememberCompletedConsultation: vi.fn().mockResolvedValue({}) } as never
    );
    const collect = () => new Promise<void>((resolve, reject) => {
      service.streamUserConsultation("user-1", "consult-1").subscribe({ complete: resolve, error: reject });
    });

    await Promise.all([collect(), collect()]);

    expect(provider.streamConsultation).toHaveBeenCalledOnce();
  });
});
