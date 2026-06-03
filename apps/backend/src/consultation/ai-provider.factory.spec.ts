import { ConfigService } from "@nestjs/config";
import { describe, expect, it } from "vitest";
import {
  createAiProvider,
  MockAiProvider,
  OpenAiConsultationProvider,
  ResilientAiProvider
} from "./ai-provider";

describe("createAiProvider", () => {
  it("uses the mock provider when no OpenAI API key is configured", () => {
    const provider = createAiProvider(config({}));

    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it("uses OpenAI provider when an API key is configured", () => {
    const provider = createAiProvider(
      config({
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "gpt-4.1-mini"
      })
    );

    expect(provider).toBeInstanceOf(ResilientAiProvider);
    expect((provider as ResilientAiProvider).primary).toBeInstanceOf(OpenAiConsultationProvider);
  });

  it("uses the configured OpenAI-compatible provider for DeepSeek/Hermes", () => {
    const provider = createAiProvider(
      config({
        AI_PROVIDER: "deepseek",
        DEEPSEEK_API_KEY: "test-deepseek-key",
        DEEPSEEK_BASE_URL: "https://api.deepseek.com",
        DEEPSEEK_MODEL: "deepseek-chat"
      })
    );

    expect(provider).toBeInstanceOf(ResilientAiProvider);
    const primary = (provider as ResilientAiProvider).primary;
    expect(primary).toBeInstanceOf(OpenAiConsultationProvider);
    expect((primary as OpenAiConsultationProvider).providerName).toBe("deepseek");
    expect((primary as OpenAiConsultationProvider).model).toBe("deepseek-chat");
  });

  it("falls back to mock when DeepSeek is selected without an API key", () => {
    const provider = createAiProvider(
      config({
        AI_PROVIDER: "deepseek"
      })
    );

    expect(provider).toBeInstanceOf(MockAiProvider);
  });

  it("supports the Hermes alias for the DeepSeek-compatible provider", () => {
    const provider = createAiProvider(
      config({
        AI_PROVIDER: "hermes",
        HERMES_API_KEY: "test-hermes-key",
        HERMES_MODEL: "deepseek-chat"
      })
    );

    expect(provider).toBeInstanceOf(ResilientAiProvider);
    const primary = (provider as ResilientAiProvider).primary;
    expect((primary as OpenAiConsultationProvider).providerName).toBe("hermes");
    expect((primary as OpenAiConsultationProvider).model).toBe("deepseek-chat");
  });
});

function config(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key]
  } as ConfigService;
}
