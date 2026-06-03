import type { ConsultationTone } from "@metamystic/shared";

export interface ProfileMemorySignals {
  decisionTopics: string[];
  riskStyle: string;
  preferredTone: string;
  sources: string[];
  updatedAt?: string | undefined;
}

export interface MemoryExtractionInput {
  consultationId: string;
  question: string;
  answer: string;
  tone: ConsultationTone;
}

const topicRules: Array<{ topic: string; keywords: string[] }> = [
  { topic: "\u6d77\u5916\u53d1\u5c55", keywords: ["\u5fb7\u56fd", "\u6d77\u5916", "\u51fa\u56fd", "\u79fb\u6c11", "\u7559\u5b66", "\u7b7e\u8bc1"] },
  { topic: "\u804c\u4e1a\u53d1\u5c55", keywords: ["\u804c\u4e1a", "\u5de5\u4f5c", "\u8df3\u69fd", "\u521b\u4e1a", "\u53d1\u5c55", "\u4e8b\u4e1a"] },
  { topic: "\u611f\u60c5\u5173\u7cfb", keywords: ["\u611f\u60c5", "\u604b\u7231", "\u5a5a\u59fb", "\u5173\u7cfb", "\u590d\u5408"] },
  { topic: "\u8d22\u52a1\u51b3\u7b56", keywords: ["\u8d22", "\u6295\u8d44", "\u4e70\u623f", "\u6536\u5165", "\u94b1"] },
  { topic: "\u5b66\u4e60\u6210\u957f", keywords: ["\u5b66\u4e60", "\u8003\u8bd5", "\u8bed\u8a00", "\u8bc1\u4e66", "\u8fdb\u4fee"] }
];

export function extractProfileMemorySignals(input: MemoryExtractionInput): ProfileMemorySignals {
  const corpus = `${input.question}\n${input.answer}`;
  const decisionTopics = topicRules
    .filter((rule) => rule.keywords.some((keyword) => corpus.includes(keyword)))
    .map((rule) => rule.topic);

  return {
    decisionTopics,
    riskStyle: inferRiskStyle(corpus),
    preferredTone: input.tone === "gentle" ? "\u6e29\u67d4\u966a\u4f34" : "\u7406\u6027\u7b56\u7565",
    sources: [input.consultationId]
  };
}

export function mergeProfileMemorySignals(
  existing: Partial<ProfileMemorySignals> | null | undefined,
  incoming: ProfileMemorySignals
): ProfileMemorySignals {
  return {
    decisionTopics: unique([...(existing?.decisionTopics ?? []), ...incoming.decisionTopics]),
    riskStyle: incoming.riskStyle || existing?.riskStyle || "\u672a\u77e5",
    preferredTone: incoming.preferredTone || existing?.preferredTone || "\u7406\u6027\u7b56\u7565",
    sources: unique([...(existing?.sources ?? []), ...incoming.sources]),
    updatedAt: new Date().toISOString()
  };
}

function inferRiskStyle(corpus: string): string {
  if (["\u62c5\u5fc3", "\u98ce\u9669", "\u4e0d\u786e\u5b9a", "\u7a33", "\u5148"].some((keyword) => corpus.includes(keyword))) {
    return "\u7a33\u5065\u8bd5\u63a2";
  }
  if (["\u51b2", "\u7acb\u523b", "\u5927\u80c6", "\u5168\u804c"].some((keyword) => corpus.includes(keyword))) {
    return "\u79ef\u6781\u8fdb\u53d6";
  }
  return "\u5e73\u8861\u89c2\u671b";
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}
