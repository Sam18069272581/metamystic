import { describe, expect, it } from "vitest";
import { buildAccountNextStep } from "./account-next-step";

describe("buildAccountNextStep", () => {
  it("shows a loading state before declaring the user anonymous", () => {
    expect(buildAccountNextStep({ loading: true })).toMatchObject({
      kind: "loading",
      title: "\u6b63\u5728\u540c\u6b65\u767b\u5f55\u72b6\u6001",
      primaryAction: "disabled",
      primaryHref: undefined
    });
  });

  it("asks anonymous users to log in", () => {
    expect(buildAccountNextStep({ loading: false })).toMatchObject({
      kind: "anonymous",
      title: "\u767b\u5f55\u540e\u4fdd\u5b58\u4f60\u7684\u547d\u76d8",
      primaryAction: "link",
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
      title: "\u5148\u5efa\u7acb\u51fa\u751f\u6863\u6848",
      primaryAction: "link",
      primaryHref: "#profile-form"
    });
  });

  it("creates a Bazi chart from the default profile without leaving the account page", () => {
    expect(
      buildAccountNextStep({
        loading: false,
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        profiles: {
          profiles: [profile("profile-1"), profile("profile-2")],
          defaultProfileId: "profile-2"
        },
        archive: { baziCharts: [], ziweiCharts: [], astrologyCharts: [] }
      })
    ).toMatchObject({
      kind: "needs_bazi",
      title: "\u751f\u6210\u7b2c\u4e00\u5f20\u516b\u5b57\u547d\u76d8",
      primaryAction: "create_bazi",
      profileId: "profile-2"
    });
  });

  it("falls back to the archive profile when the profile list is not loaded yet", () => {
    expect(
      buildAccountNextStep({
        loading: false,
        user: { id: "user-1", email: "user@example.com", role: "USER" },
        archive: {
          profile: profile("archive-profile"),
          baziCharts: [],
          ziweiCharts: [],
          astrologyCharts: []
        }
      })
    ).toMatchObject({
      kind: "needs_bazi",
      primaryAction: "create_bazi",
      profileId: "archive-profile"
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
              dayMaster: "\u4e59",
              dayMasterStatus: "weak",
              mainPattern: "\u6740\u5370\u76f8\u751f",
              pillars: {
                year: { stem: "\u4e59", branch: "\u4ea5", tenGod: "\u6bd4\u80a9", hiddenStems: ["\u58ec"] },
                month: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"] },
                day: { stem: "\u4e59", branch: "\u536f", tenGod: "\u65e5\u4e3b", hiddenStems: ["\u4e59"] },
                hour: { stem: "\u8f9b", branch: "\u5df3", tenGod: "\u4e03\u6740", hiddenStems: ["\u4e19"] }
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
      title: "\u53ef\u4ee5\u5f00\u59cb AI \u547d\u7406\u5206\u6790",
      primaryAction: "link",
      primaryHref: "/consult?profileId=profile-1&chartId=chart-1"
    });
  });
});

function profile(id: string) {
  return {
    id,
    anonymousUserId: "user-1",
    birthTime: "1995-05-20T02:30:00.000Z",
    birthTimezone: "Asia/Shanghai",
    gender: "female" as const,
    createdAt: "2026-06-13T00:00:00.000Z",
    updatedAt: "2026-06-13T00:00:00.000Z"
  };
}
