import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ProfileService } from "./profile.service";

describe("ProfileService memory", () => {
  it("returns anonymous memory only for the matching anonymous user id", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          memorySignals: {
            decisionTopics: ["\u6d77\u5916\u53d1\u5c55"],
            riskStyle: "\u7a33\u5065\u8bd5\u63a2",
            preferredTone: "\u7406\u6027\u7b56\u7565",
            sources: ["consult-1"]
          }
        })
      }
    };
    const service = new ProfileService(prisma as never);

    const memory = await service.getAnonymousMemorySignals("profile-1", "anon-1");

    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: {
        id: "profile-1",
        user: { anonymousUserId: "anon-1", email: null }
      },
      select: { memorySignals: true }
    });
    expect(memory.decisionTopics).toEqual(["\u6d77\u5916\u53d1\u5c55"]);
  });

  it("hides anonymous memory when the anonymous user id is missing or mismatched", async () => {
    const service = new ProfileService({
      profile: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    } as never);

    await expect(service.getAnonymousMemorySignals("profile-1", undefined)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getAnonymousMemorySignals("profile-1", "wrong-anon")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns user memory only for a profile owned by the current user", async () => {
    const prisma = {
      profile: {
        findFirst: vi.fn().mockResolvedValue({
          memorySignals: {
            decisionTopics: ["\u804c\u4e1a\u53d1\u5c55"],
            riskStyle: "\u5148\u9a8c\u8bc1",
            preferredTone: "\u7406\u6027\u7b56\u7565",
            sources: ["consult-2"]
          }
        })
      }
    };
    const service = new ProfileService(prisma as never);

    const memory = await service.getUserMemorySignals("user-1", "profile-1");

    expect(prisma.profile.findFirst).toHaveBeenCalledWith({
      where: { id: "profile-1", userId: "user-1" },
      select: { memorySignals: true }
    });
    expect(memory.sources).toEqual(["consult-2"]);
  });

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
