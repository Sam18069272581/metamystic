import type { ProfileMemorySignalsDto } from "@metamystic/shared";

export interface ProfileMemoryView {
  topicText: string;
  riskStyle: string;
  preferredTone: string;
  sourceText: string;
}

export function buildProfileMemoryView(memory: ProfileMemorySignalsDto): ProfileMemoryView {
  return {
    topicText: memory.decisionTopics.length > 0 ? memory.decisionTopics.join(" / ") : "\u6682\u65e0\u957f\u671f\u4e3b\u9898",
    riskStyle: memory.riskStyle,
    preferredTone: memory.preferredTone,
    sourceText: `${memory.sources.length} \u6b21\u54a8\u8be2\u6c89\u6dc0`
  };
}
