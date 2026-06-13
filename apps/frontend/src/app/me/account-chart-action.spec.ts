import { describe, expect, it } from "vitest";
import type { UserChartArchiveDto } from "@metamystic/shared";
import { buildAccountChartAction } from "./account-chart-action";

const archiveWithProfile: UserChartArchiveDto = {
  profile: {
    id: "profile-1",
    anonymousUserId: "",
    birthTime: "1995-05-20T10:30:00.000Z",
    birthTimezone: "Asia/Shanghai",
    gender: "female",
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z"
  },
  baziCharts: [],
  ziweiCharts: [],
  astrologyCharts: []
};

describe("account chart action", () => {
  it("creates missing charts from the saved default profile", () => {
    expect(buildAccountChartAction({ archive: archiveWithProfile, kind: "ziwei" })).toEqual({
      action: "create",
      label: "生成紫微",
      profileId: "profile-1"
    });
    expect(buildAccountChartAction({ archive: archiveWithProfile, kind: "astrology" })).toEqual({
      action: "create",
      label: "生成星盘",
      profileId: "profile-1"
    });
  });

  it("opens details when a chart already exists", () => {
    expect(
      buildAccountChartAction({
        archive: {
          ...archiveWithProfile,
          ziweiCharts: [
            {
              id: "ziwei-1",
              profileId: "profile-1",
              lifePalace: "life",
              bodyPalace: "career",
              palaces: [],
              summary: "紫微摘要",
              createdAt: "2026-06-01T00:00:00.000Z"
            }
          ]
        },
        kind: "ziwei"
      })
    ).toEqual({
      action: "view",
      href: "/me/charts/ziwei/ziwei-1",
      label: "查看紫微"
    });
  });

  it("disables chart creation until a profile exists", () => {
    expect(
      buildAccountChartAction({
        archive: { profile: undefined, baziCharts: [], ziweiCharts: [], astrologyCharts: [] },
        kind: "astrology"
      })
    ).toEqual({
      action: "disabled",
      label: "先建档案"
    });
  });
});
