import { describe, expect, it } from "vitest";
import { buildAccountNextStep } from "./account-next-step";

describe("buildAccountNextStep", () => {
  it("shows a loading state before declaring the user anonymous", () => {
    expect(buildAccountNextStep({ loading: true })).toMatchObject({
      kind: "loading",
      title: "正在同步登录状态",
      primaryHref: undefined
    });
  });

  it("asks anonymous users to log in", () => {
    expect(buildAccountNextStep({ loading: false })).toMatchObject({
      kind: "anonymous",
      title: "登录后保存你的命盘",
      primaryHref: "/auth/login"
    });
  });

  it("guides logged-in users without profiles to create a birth profile", () => {
    expect(
      buildAccountNextStep({
        loading: false,
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        profiles: { profiles: [] },
        archive: { baziCharts: [], ziweiCharts: [], astrologyCharts: [] }
      })
    ).toMatchObject({
      kind: "needs_profile",
      title: "先建立出生档案",
      primaryHref: "#profile-form"
    });
  });

  it("guides users with a profile but no Bazi chart to generate a chart", () => {
    expect(
      buildAccountNextStep({
        loading: false,
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        profiles: {
          profiles: [
            {
              id: "profile-1",
              anonymousUserId: "user-1",
              birthTime: "1995-05-20T02:30:00.000Z",
              birthTimezone: "Asia/Shanghai",
              gender: "female",
              createdAt: "2026-06-13T00:00:00.000Z",
              updatedAt: "2026-06-13T00:00:00.000Z"
            }
          ],
          defaultProfileId: "profile-1"
        },
        archive: { baziCharts: [], ziweiCharts: [], astrologyCharts: [] }
      })
    ).toMatchObject({
      kind: "needs_bazi",
      title: "生成第一张八字命盘",
      primaryHref: "/charts/bazi"
    });
  });

  it("links users with a Bazi chart directly into AI consultation", () => {
    expect(
      buildAccountNextStep({
        loading: false,
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        profiles: { profiles: [] },
        archive: {
          baziCharts: [
            {
              id: "chart-1",
              profileId: "profile-1",
              dayMaster: "乙",
              dayMasterStatus: "weak",
              mainPattern: "杀印相生",
              pillars: {
                year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: ["壬"] },
                month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"] },
                day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: ["乙"] },
                hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: ["丙"] }
              },
              elements: { wood: 0.32, fire: 0.22, earth: 0.15, metal: 0.2, water: 0.11 },
              createdAt: "2026-06-13T00:00:00.000Z"
            }
          ],
          ziweiCharts: [],
          astrologyCharts: []
        }
      })
    ).toMatchObject({
      kind: "ready",
      title: "可以开始 AI 命理分析",
      primaryHref: "/consult?profileId=profile-1&chartId=chart-1"
    });
  });
});
