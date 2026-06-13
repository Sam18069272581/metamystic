import { describe, expect, it } from "vitest";
import { formatProviderStatus } from "./consultation-provider-status";

describe("formatProviderStatus", () => {
  it("formats fallback provider status for the user", () => {
    expect(
      formatProviderStatus({
        type: "provider",
        consultationId: "consult-1",
        providerName: "mock",
        model: "rule-based",
        status: "fallback",
        isFallback: true,
        failedProviderName: "deepseek",
        reason: "timeout",
        durationMs: 1200
      })
    ).toEqual({
      tone: "fallback",
      title: "\u5907\u7528\u5206\u6790\u6a21\u5f0f",
      detail: "\u4e3b\u6a21\u578b deepseek \u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u5df2\u5207\u6362\u5230 mock / rule-based\u3002"
    });
  });

  it("formats primary provider status for the user", () => {
    expect(
      formatProviderStatus({
        type: "provider",
        consultationId: "consult-1",
        providerName: "deepseek",
        model: "deepseek-chat",
        status: "primary",
        isFallback: false
      })
    ).toEqual({
      tone: "primary",
      title: "AI \u6a21\u578b\u8fde\u63a5\u4e2d",
      detail: "\u5f53\u524d\u4f7f\u7528 deepseek / deepseek-chat \u8fdb\u884c\u547d\u7406\u5206\u6790\u3002"
    });
  });
});
