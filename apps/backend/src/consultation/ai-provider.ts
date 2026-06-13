import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AiSectionType, BaziChartDto, ConsultationTone, KnowledgeChunkDto } from "@metamystic/shared";
import OpenAI from "openai";
import { formatConsultationCitationLine, getCitationSource, getCitationTitle } from "./consultation-citation";
import { buildConsultationPrompt } from "./consultation-prompt";
import { parseConsultationResponseSections } from "./consultation-response-parser";

export interface AiConsultationInput {
  question: string;
  tone: ConsultationTone;
  chart: BaziChartDto;
  citations: KnowledgeChunkDto[];
  disclaimer: string;
}

export interface AiProviderChunk {
  section: AiSectionType;
  content: string;
}

export interface AiProviderStatusEvent {
  type: "provider";
  providerName: string;
  model: string;
  status: "primary" | "fallback";
  isFallback: boolean;
  failedProviderName?: string | undefined;
  reason?: string | undefined;
  durationMs?: number | undefined;
}

export type AiProviderStreamEvent = AiProviderChunk | AiProviderStatusEvent;

export interface AiProvider {
  readonly providerName?: string | undefined;
  readonly model?: string | undefined;
  streamConsultation(input: AiConsultationInput): AsyncGenerator<AiProviderStreamEvent>;
}

interface OpenAiClientLike {
  chat: {
    completions: {
      create(input: unknown): Promise<AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>>;
    };
  };
}

export interface OpenAiConsultationProviderOptions {
  apiKey: string;
  baseURL?: string;
  model: string;
  providerName?: string;
  client?: OpenAiClientLike;
}

export function createAiProvider(config: ConfigService): AiProvider {
  const provider = (config.get<string>("AI_PROVIDER") ?? "openai").toLowerCase();
  const providerConfig = getOpenAiCompatibleProviderConfig(provider, config);

  if (!providerConfig?.apiKey) {
    return new MockAiProvider();
  }

  return new ResilientAiProvider(
    new OpenAiConsultationProvider({
      apiKey: providerConfig.apiKey,
      model: providerConfig.model,
      providerName: providerConfig.providerName,
      ...(providerConfig.baseURL ? { baseURL: providerConfig.baseURL } : {})
    }),
    new MockAiProvider()
  );
}

interface OpenAiCompatibleProviderConfig {
  apiKey: string | undefined;
  baseURL?: string;
  model: string;
  providerName: string;
}

function getOpenAiCompatibleProviderConfig(
  provider: string,
  config: ConfigService
): OpenAiCompatibleProviderConfig | undefined {
  if (provider === "deepseek" || provider === "hermes") {
    return {
      apiKey:
        provider === "hermes"
          ? config.get<string>("HERMES_API_KEY") ?? config.get<string>("DEEPSEEK_API_KEY")
          : config.get<string>("DEEPSEEK_API_KEY") ?? config.get<string>("HERMES_API_KEY"),
      ...withBaseURL(
        config.get<string>(provider === "hermes" ? "HERMES_BASE_URL" : "DEEPSEEK_BASE_URL") ??
          config.get<string>("DEEPSEEK_BASE_URL") ??
          "https://api.deepseek.com"
      ),
      model:
        config.get<string>(provider === "hermes" ? "HERMES_MODEL" : "DEEPSEEK_MODEL") ??
        config.get<string>("DEEPSEEK_MODEL") ??
        "deepseek-chat",
      providerName: provider
    };
  }

  return {
    apiKey: config.get<string>("OPENAI_API_KEY"),
    model: config.get<string>("OPENAI_MODEL") ?? "gpt-4.1-mini",
    providerName: "openai"
  };
}

function withBaseURL(baseURL: string | undefined): Pick<OpenAiCompatibleProviderConfig, "baseURL"> | Record<string, never> {
  return baseURL ? { baseURL } : {};
}

export class ResilientAiProvider implements AiProvider {
  private readonly logger = new Logger(ResilientAiProvider.name);

  constructor(
    readonly primary: AiProvider,
    private readonly fallback: AiProvider
  ) {}

  async *streamConsultation(input: AiConsultationInput): AsyncGenerator<AiProviderStreamEvent> {
    const startedAt = Date.now();
    const primaryDescriptor = describeProvider(this.primary, "primary");
    yield {
      type: "provider",
      providerName: primaryDescriptor.providerName,
      model: primaryDescriptor.model,
      status: "primary",
      isFallback: false
    };

    try {
      for await (const chunk of this.primary.streamConsultation(input)) {
        yield chunk;
      }
    } catch (error) {
      const fallbackDescriptor = describeProvider(this.fallback, "fallback");
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `AI provider ${primaryDescriptor.providerName}/${primaryDescriptor.model} failed after ${
          Date.now() - startedAt
        }ms; falling back to ${fallbackDescriptor.providerName}/${fallbackDescriptor.model}. ${reason}`
      );
      yield {
        type: "provider",
        providerName: fallbackDescriptor.providerName,
        model: fallbackDescriptor.model,
        status: "fallback",
        isFallback: true,
        failedProviderName: primaryDescriptor.providerName,
        reason: "Primary AI provider unavailable",
        durationMs: Date.now() - startedAt
      };
      for await (const chunk of this.fallback.streamConsultation(input)) {
        yield chunk;
      }
    }
  }
}

export class OpenAiConsultationProvider implements AiProvider {
  private readonly client: OpenAiClientLike;
  readonly model: string;
  readonly providerName: string;

  constructor(private readonly options: OpenAiConsultationProviderOptions) {
    this.model = options.model;
    this.providerName = options.providerName ?? "openai";
    this.client =
      options.client ??
      (new OpenAI({
        apiKey: options.apiKey,
        ...(options.baseURL ? { baseURL: options.baseURL } : {})
      }) as unknown as OpenAiClientLike);
  }

  async *streamConsultation(input: AiConsultationInput): AsyncGenerator<AiProviderChunk> {
    const prompt = buildConsultationPrompt(input);
    const stream = await this.client.chat.completions.create({
      model: this.options.model,
      stream: true,
      temperature: 0.4,
      messages: [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user }
      ]
    });
    let content = "";

    for await (const event of stream) {
      content += event.choices?.[0]?.delta?.content ?? "";
    }

    for (const chunk of parseConsultationResponseSections(content)) {
      yield chunk;
    }
  }
}

export class MockAiProvider implements AiProvider {
  readonly providerName = "mock";
  readonly model = "rule-based";

  async *streamConsultation(input: AiConsultationInput): AsyncGenerator<AiProviderChunk> {
    const prompt = buildConsultationPrompt(input);
    const primaryCitation = input.citations.at(0);
    const toneLead =
      input.tone === "gentle"
        ? "\u5148\u63a5\u4f4f\u4f60\u7684\u4e0d\u786e\u5b9a\u611f\u3002"
        : "\u5148\u7ed9\u7b56\u7565\u7ed3\u8bba\u3002";
    const citationLead = primaryCitation
      ? `\u7ed3\u5408 ${getCitationSource(primaryCitation)}\u300c${getCitationTitle(primaryCitation)}\u300d\u7684\u77e5\u8bc6\u4f9d\u636e\uff0c`
      : "\u5728\u5f53\u524d\u77e5\u8bc6\u4f9d\u636e\u4e0d\u8db3\u7684\u60c5\u51b5\u4e0b\uff0c";
    const chunks: AiProviderChunk[] = [
      {
        section: "verdict",
        content: `${toneLead}${citationLead}\u4ece ${input.chart.mainPattern} \u4e0e\u65e5\u4e3b ${input.chart.dayMaster} \u7684\u7ed3\u6784\u770b\uff0c\u8fd9\u4e2a\u95ee\u9898\u9002\u5408\u7528\u201c\u7a33\u6001\u63a8\u8fdb\u3001\u5148\u9a8c\u8bc1\u540e\u6269\u5927\u6295\u5165\u201d\u7684\u65b9\u5f0f\u5904\u7406\u3002`
      },
      {
        section: "logic",
        content: `\u6392\u76d8\u6458\u8981\u663e\u793a\u65e5\u4e3b\u72b6\u6001\u4e3a ${input.chart.dayMasterStatus}\uff0c\u4e94\u884c\u91cc\u6728\u706b\u5408\u8ba1\u7ea6 ${Math.round(
          (input.chart.elements.wood + input.chart.elements.fire) * 100
        )}%\u3002\u672c\u6b21\u5206\u6790\u4f1a\u4f18\u5148\u56f4\u7ed5\u5df2\u68c0\u7d22\u7684 RAG \u4f9d\u636e\u5c55\u5f00\uff0c\u800c\u4e0d\u662f\u6cdb\u6cdb\u5957\u8bdd\u3002`
      },
      {
        section: "factors",
        content: [
          `\u65e5\u4e3b ${input.chart.dayMaster} / ${input.chart.dayMasterStatus} \u2192 \u5148\u770b\u627f\u538b\u80fd\u529b\u4e0e\u8d44\u6e90\u8865\u4f4d\uff0c\u4e0d\u5efa\u8bae\u7acb\u523b\u91cd\u4ed3\u3002`,
          `${input.chart.mainPattern} \u2192 \u9002\u5408\u628a\u538b\u529b\u8f6c\u6210\u5b66\u4e60\u3001\u8bc1\u4e66\u3001\u5236\u5ea6\u5316\u8def\u5f84\u3002`,
          `\u6728\u706b\u6bd4\u91cd\u7ea6 ${Math.round((input.chart.elements.wood + input.chart.elements.fire) * 100)}% \u2192 \u884c\u52a8\u529b\u548c\u8868\u8fbe\u6b32\u5b58\u5728\uff0c\u4f46\u9700\u8981\u7528\u8282\u594f\u7ba1\u7406\u98ce\u9669\u3002`
        ].join("\n")
      },
      {
        section: "advice",
        content: `\u9488\u5bf9\u201c${input.question}\u201d\uff0c\u5efa\u8bae\u5148\u5217\u51fa 2 \u4e2a\u53ef\u9a8c\u8bc1\u52a8\u4f5c\uff1a\u4e00\u4e2a\u5728 7 \u5929\u5185\u5b8c\u6210\uff0c\u4e00\u4e2a\u5728 30 \u5929\u5185\u5b8c\u6210\u3002\u82e5\u8fde\u7eed\u4e24\u8f6e\u53cd\u9988\u90fd\u53d8\u597d\uff0c\u518d\u6269\u5927\u6295\u5165\uff1b\u82e5\u53cd\u9988\u53d8\u5dee\uff0c\u5148\u8c03\u6574\u8282\u594f\u548c\u8d44\u6e90\u914d\u7f6e\u3002`
      },
      {
        section: "citation",
        content: formatCitationSection(input.citations, prompt.user)
      },
      {
        section: "disclaimer",
        content: input.disclaimer
      }
    ];

    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, 120));
      yield chunk;
    }
  }
}

function describeProvider(provider: AiProvider, fallbackName: string): { providerName: string; model: string } {
  return {
    providerName: provider.providerName ?? fallbackName,
    model: provider.model ?? "unknown"
  };
}

function formatCitationSection(citations: KnowledgeChunkDto[], promptUser: string): string {
  if (citations.length === 0) {
    return "\u5f53\u524d\u95ee\u9898\u6ca1\u6709\u547d\u4e2d\u660e\u786e\u77e5\u8bc6\u7247\u6bb5\uff0c\u672c\u6b21\u89e3\u8bfb\u4ec5\u57fa\u4e8e\u547d\u76d8\u7ed3\u6784\u548c\u901a\u7528\u98ce\u63a7\u539f\u5219\u3002";
  }

  return citations
    .map((citation, index) => {
      const promptKey = `[K${index + 1}]`;
      return `${formatConsultationCitationLine(citation, index)}${
        promptUser.includes(promptKey) ? "" : "\uff08\u672a\u6ce8\u5165\u63d0\u793a\u8bcd\uff09"
      }`;
    })
    .join("\n");
}
