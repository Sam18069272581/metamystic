import { describe, expect, it } from "vitest";
import { useAppStore } from "./app-store";

describe("app store provider status", () => {
  it("stores provider status and clears it with stream reset", () => {
    useAppStore.getState().resetStream();

    useAppStore.getState().setProviderStatus({
      type: "provider",
      consultationId: "consult-1",
      providerName: "mock",
      model: "rule-based",
      status: "fallback",
      isFallback: true,
      failedProviderName: "openai",
      reason: "OpenAI unavailable",
      durationMs: 42
    });

    expect(useAppStore.getState().providerStatus).toEqual(
      expect.objectContaining({
        providerName: "mock",
        model: "rule-based",
        isFallback: true
      })
    );

    useAppStore.getState().resetStream();

    expect(useAppStore.getState().providerStatus).toBeUndefined();
  });
});
