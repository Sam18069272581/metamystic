import { describe, expect, it } from "vitest";
import { getDailyFortunePrimaryAction } from "./home-dashboard-view";

describe("home dashboard view helpers", () => {
  it("routes each daily fortune state to the next required product step", () => {
    expect(getDailyFortunePrimaryAction("needs_profile")).toEqual({
      href: "/me",
      label: "\u5b8c\u5584\u6211\u7684\u6863\u6848"
    });
    expect(getDailyFortunePrimaryAction("needs_bazi_chart")).toEqual({
      href: "/charts/bazi",
      label: "\u5b8c\u6210\u516b\u5b57\u6392\u76d8"
    });
    expect(getDailyFortunePrimaryAction("ready")).toEqual({
      href: "/consult",
      label: "\u5f00\u59cb AI \u547d\u7406\u5206\u6790"
    });
  });
});
