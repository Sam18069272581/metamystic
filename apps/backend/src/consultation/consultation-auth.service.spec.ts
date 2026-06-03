import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ConsultationService } from "./consultation.service";

describe("ConsultationService authenticated creation", () => {
  it("rejects creating a consultation for another user's profile", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({ id: "profile-1", userId: "other-user" })
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(
      service.createUserConsultation("user-1", {
        profileId: "profile-1",
        chartId: "chart-1",
        question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
        tone: "strategic"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("returns consultation history only when it belongs to the current user", async () => {
    const prisma = {
      consultation: {
        findFirst: vi.fn().mockResolvedValue({
          id: "consult-1",
          userId: "user-1",
          profileId: "profile-1",
          chartId: "chart-1",
          question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
          tone: "strategic",
          status: "completed",
          summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
          createdAt: new Date("2026-06-02T00:00:00.000Z"),
          messages: [
            {
              id: "msg-1",
              consultationId: "consult-1",
              role: "user",
              content: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
              createdAt: new Date("2026-06-02T00:00:00.000Z")
            }
          ]
        })
      }
    };
    const service = new ConsultationService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    const history = await service.getUserHistory("user-1", "consult-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(history.messages).toHaveLength(1);
    expect(prisma.consultation.findFirst).toHaveBeenCalledWith({
      where: { id: "consult-1", userId: "user-1" },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
  });

  it("hides consultation history that does not belong to the current user", async () => {
    const service = new ConsultationService(
      {
        consultation: {
          findFirst: vi.fn().mockResolvedValue(null)
        }
      } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    await expect(service.getUserHistory("user-1", "other-consult")).rejects.toBeInstanceOf(NotFoundException);
  });
});
