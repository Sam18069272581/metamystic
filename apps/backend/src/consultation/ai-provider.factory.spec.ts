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
});

function config(values: Record<string, string>): ConfigService {
  return {
    get: (key: string) => values[key]
  } as ConfigService;
}
