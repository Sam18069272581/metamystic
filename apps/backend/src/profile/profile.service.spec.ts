import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "./profile.service";

describe("ProfileService memory", () => {
  it("stores merged memory signals for a completed consultation", async () => {
    const prisma = {
      profile: {
        findUnique: vi.fn().mockResolvedValue({
          id: "profile-1",
          memorySignals: {
            decisionTopics: ["\u611f\u60c5\u5173\u7cfb"],
            riskStyle: "\u7a33\u5065\u8bd5\u63a2",
            preferredTone: "\u6e29\u67d4\u966a\u4f34",
            sources: ["consult-0"]
          }
        }),
        update: vi.fn().mockResolvedValue({})
      },
      user: {
        upsert: vi.fn()
      }
    };
    const service = new ProfileService(prisma as never);

    await service.rememberCompletedConsultation({
      profileId: "profile-1",
      consultationId: "consult-1",
      question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f",
      answer: "\u5efa\u8bae\u5148\u505a\u8bed\u8a00\u548c\u804c\u4e1a\u8def\u5f84\u9a8c\u8bc1\u3002",
      tone: "strategic"
    });

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: {
          memorySignals: expect.objectContaining({
            decisionTopics: expect.arrayContaining([
              "\u611f\u60c5\u5173\u7cfb",
              "\u6d77\u5916\u53d1\u5c55",
              "\u804c\u4e1a\u53d1\u5c55"
            ]),
            preferredTone: "\u7406\u6027\u7b56\u7565",
            sources: ["consult-0", "consult-1"]
          })
        }
      })
    );
  });
});
