import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService listRecentByProfile", () => {
  it("returns recent consultations ordered by newest first", async () => {
    const prisma = {
      consultation: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "consult-new",
            profileId: "profile-1",
            chartId: "chart-1",
            question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
            tone: "strategic",
            status: "completed",
            summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
            createdAt: new Date("2026-05-30T10:00:00.000Z")
          },
          {
            id: "consult-old",
            profileId: "profile-1",
            chartId: "chart-1",
            question: "\u6211\u9002\u5408\u6362\u5de5\u4f5c\u5417\uff1f",
            tone: "gentle",
            status: "completed",
            summary: "\u5148\u89c2\u5bdf\u518d\u51b3\u7b56",
            createdAt: new Date("2026-05-29T10:00:00.000Z")
          }
        ])
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const result = await service.listRecentByProfile("profile-1");

    expect(prisma.consultation.findMany).toHaveBeenCalledWith({
      where: { profileId: "profile-1" },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    expect(result.profileId).toBe("profile-1");
    expect(result.consultations.map((item) => item.id)).toEqual(["consult-new", "consult-old"]);
    expect(result.consultations[0]?.createdAt).toBe("2026-05-30T10:00:00.000Z");
  });
});
