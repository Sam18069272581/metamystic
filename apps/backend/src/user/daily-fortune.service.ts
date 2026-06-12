import { Injectable } from "@nestjs/common";
import type { BaziChartDto, DailyFortuneDto, FiveElement } from "@metamystic/shared";
import { PrismaService } from "../prisma/prisma.service";

const elements = ["wood", "fire", "earth", "metal", "water"] as const satisfies readonly FiveElement[];

const elementLabels: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const elementActions: Record<FiveElement, string[]> = {
  wood: ["主动梳理计划", "发起一次温和沟通", "给长期目标补一小步"],
  fire: ["公开表达想法", "推进需要热度的任务", "安排一次轻量社交"],
  earth: ["整理资源和预算", "确认边界与承诺", "把复杂问题拆成清单"],
  metal: ["做取舍和复盘", "处理合同、规则、结构化事务", "减少不必要的消耗"],
  water: ["收集信息再决策", "适合学习、研究和深谈", "给情绪留出缓冲"]
};

@Injectable()
export class DailyFortuneService {
  constructor(private readonly prisma: PrismaService) {}

  async getToday(userId: string, now = new Date()): Promise<DailyFortuneDto> {
    const date = toDateKey(now);
    const dailyElement = elementForDate(now);
    const profile = await this.prisma.profile.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: "asc" }
    });

    if (!profile) {
      return onboardingFortune(date, dailyElement, "needs_profile");
    }

    const chart = await this.prisma.baziChart.findFirst({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" }
    });

    if (!chart) {
      return {
        ...onboardingFortune(date, dailyElement, "needs_bazi_chart"),
        profile: {
          id: profile.id,
          label: profile.label ?? profile.displayName ?? "自己"
        },
        title: "先完成八字排盘",
        summary: "今日签语需要结合你的八字命盘生成。先完成排盘后，系统会根据日主、喜用神和当日五行给出个性化建议。"
      };
    }

    return buildReadyFortune({
      chart,
      date,
      dailyElement,
      profile: {
        id: profile.id,
        label: profile.label ?? profile.displayName ?? "自己"
      }
    });
  }
}

function buildReadyFortune(input: {
  chart: {
    id: string;
    dayMaster: string;
    dayMasterStatus: string;
    mainPattern: string;
    elements: unknown;
    metadata: unknown;
  };
  date: string;
  dailyElement: FiveElement;
  profile: { id: string; label: string };
}): DailyFortuneDto {
  const usefulGods = readElementList(input.chart.metadata, "usefulGods");
  const unfavorableGods = readElementList(input.chart.metadata, "unfavorableGods");
  const elementWeight = readElementWeight(input.chart.elements, input.dailyElement);
  const usefulBonus = usefulGods.includes(input.dailyElement) ? 12 : 0;
  const cautionPenalty = unfavorableGods.includes(input.dailyElement) ? 8 : 0;
  const score = clampScore(Math.round(64 + elementWeight * 28 + usefulBonus - cautionPenalty));
  const elementLabel = elementLabels[input.dailyElement];
  const isUseful = usefulGods.includes(input.dailyElement);

  return {
    date: input.date,
    status: "ready",
    profile: input.profile,
    score,
    element: input.dailyElement,
    title: isUseful ? `${elementLabel}气得用，适合顺势推进` : `${elementLabel}气当令，适合稳中取势`,
    summary: `今日${elementLabel}气被激活，你的日主为${input.chart.dayMaster}，格局参考「${input.chart.mainPattern}」。适合把注意力放在可验证的小决策上。`,
    advice: [
      isUseful ? "把重要事项安排在精力最稳定的时段，顺着今天的助力推进。" : "先观察局势，再选择一个最小可行动作。",
      dayMasterAdvice(input.chart.dayMasterStatus as BaziChartDto["dayMasterStatus"]),
      `今日优先动作：${elementActions[input.dailyElement][0]}。`
    ],
    cautions: [
      unfavorableGods.includes(input.dailyElement) ? `今日${elementLabel}气容易放大压力，避免在情绪高点做最终决定。` : "避免同时开启太多事项，保留复盘空间。",
      "命理建议只作为决策辅助，重要事务仍以现实信息和专业意见为准。"
    ],
    luckyActions: elementActions[input.dailyElement],
    source: {
      chartId: input.chart.id,
      dayMaster: input.chart.dayMaster,
      dayMasterStatus: input.chart.dayMasterStatus as BaziChartDto["dayMasterStatus"],
      mainPattern: input.chart.mainPattern,
      usefulGods
    }
  };
}

function onboardingFortune(
  date: string,
  element: FiveElement,
  status: "needs_profile" | "needs_bazi_chart"
): DailyFortuneDto {
  return {
    date,
    status,
    score: status === "needs_profile" ? 50 : 58,
    element,
    title: status === "needs_profile" ? "先建立你的命盘档案" : "先完成八字排盘",
    summary:
      status === "needs_profile"
        ? "填写出生信息后，MetaMystic 才能根据你的日主、五行结构和喜用神生成每日签语。"
        : "完成八字排盘后，今日签语会结合你的命盘结构生成。",
    advice: ["先完成基础档案", "再查看今日适合推进的事项", "把签语当作决策前的提醒，而不是唯一答案"],
    cautions: ["未建立命盘前只显示通用提醒。"],
    luckyActions: elementActions[element]
  };
}

function dayMasterAdvice(status: BaziChartDto["dayMasterStatus"]): string {
  if (status === "strong") {
    return "日主偏强时，今天更适合输出、取舍和承担责任，少在原地反复权衡。";
  }
  if (status === "weak") {
    return "日主偏弱时，今天先补资源、找支持，再做消耗较大的决定。";
  }
  return "日主相对平衡时，今天适合一边推进一边校准节奏。";
}

function readElementList(metadata: unknown, key: "usefulGods" | "unfavorableGods"): FiveElement[] {
  if (!metadata || typeof metadata !== "object") {
    return [];
  }
  const value = (metadata as Record<string, unknown>)[key];
  return Array.isArray(value) ? value.filter(isFiveElement) : [];
}

function readElementWeight(elementsValue: unknown, element: FiveElement): number {
  if (!elementsValue || typeof elementsValue !== "object") {
    return 0;
  }
  const value = (elementsValue as Partial<Record<FiveElement, unknown>>)[element];
  return typeof value === "number" ? value : 0;
}

function isFiveElement(value: unknown): value is FiveElement {
  return typeof value === "string" && elements.includes(value as FiveElement);
}

function elementForDate(date: Date): FiveElement {
  const dayNumber = Math.floor(date.getTime() / 86_400_000);
  return elements[Math.abs(dayNumber) % elements.length] ?? "wood";
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
