import { describe, expect, it } from "vitest";
import { buildConsultationFormView } from "./consultation-form-view";

describe("buildConsultationFormView", () => {
  it("uses direct birth input mode without saved chart params", () => {
    expect(buildConsultationFormView({})).toEqual({
      mode: "direct_birth_input",
      title: "\u65b0\u5efa AI \u547d\u7406\u5206\u6790",
      description: "\u586b\u5199\u51fa\u751f\u4fe1\u606f\u540e\uff0c\u7cfb\u7edf\u4f1a\u751f\u6210\u547d\u76d8\u5e76\u5f00\u59cb\u5206\u6790\u3002",
      showBirthFields: true,
      submitLabel: "\u5f00\u59cb AI \u547d\u7406\u5206\u6790"
    });
  });

  it("uses saved chart mode when both profile and chart params are present", () => {
    expect(buildConsultationFormView({ initialProfileId: "profile-1", initialChartId: "chart-1" })).toEqual({
      mode: "saved_chart",
      title: "\u4f7f\u7528\u5df2\u4fdd\u5b58\u547d\u76d8\u5206\u6790",
      description: "\u5df2\u9501\u5b9a\u8fd9\u5f20\u5386\u53f2\u516b\u5b57\u547d\u76d8\uff0c\u53ea\u9700\u8f93\u5165\u95ee\u9898\u5373\u53ef\u5f00\u59cb AI \u89e3\u8bfb\u3002",
      showBirthFields: false,
      submitLabel: "\u7528\u8fd9\u5f20\u547d\u76d8\u5f00\u59cb\u5206\u6790"
    });
  });

  it("falls back to direct mode when only one saved chart param exists", () => {
    expect(buildConsultationFormView({ initialChartId: "chart-1" }).showBirthFields).toBe(true);
    expect(buildConsultationFormView({ initialProfileId: "profile-1" }).showBirthFields).toBe(true);
  });
});
