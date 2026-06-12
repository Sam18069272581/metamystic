import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  BaziChartDto,
  CompatibilityDimensionDto,
  CompatibilityReadingDto,
  CompatibilityReadingListResponse,
  CreateCompatibilityRequest,
  FiveElement,
  PublicCompatibilityShareDto
} from "@metamystic/shared";
import { asPrismaJson } from "../prisma/prisma-json";
import { BaziService } from "../bazi/bazi.service";
import { PrismaService } from "../prisma/prisma.service";

const readingLimit = 20;

const elementLabels: Record<FiveElement, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水"
};

const generatingCycle: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood"
};

const controllingCycle: Record<FiveElement, FiveElement> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood"
};

const stemElements: Record<string, FiveElement> = {
  甲: "wood",
  乙: "wood",
  丙: "fire",
  丁: "fire",
  戊: "earth",
  己: "earth",
  庚: "metal",
  辛: "metal",
  壬: "water",
  癸: "water"
};

const stemCombinations: Record<string, string> = {
  甲己: "甲己合土",
  乙庚: "乙庚合金",
  丙辛: "丙辛合水",
  丁壬: "丁壬合木",
  戊癸: "戊癸合火"
};

const stemClashes: Record<string, string> = {
  甲庚: "甲庚冲",
  乙辛: "乙辛冲",
  丙壬: "丙壬冲",
  丁癸: "丁癸冲"
};

const branchCombinations: Record<string, string> = {
  子丑: "子丑六合",
  寅亥: "寅亥六合",
  卯戌: "卯戌六合",
  辰酉: "辰酉六合",
  巳申: "巳申六合",
  午未: "午未六合"
};

const branchClashes: Record<string, string> = {
  子午: "子午冲",
  丑未: "丑未冲",
  寅申: "寅申冲",
  卯酉: "卯酉冲",
  辰戌: "辰戌冲",
  巳亥: "巳亥冲"
};

const branchHarms: Record<string, string> = {
  子未: "子未害",
  丑午: "丑午害",
  寅巳: "寅巳害",
  卯辰: "卯辰害",
  申亥: "申亥害",
  酉戌: "酉戌害"
};

interface CompatibilityProfile {
  id: string;
  userId: string;
  label: string | null;
  displayName: string | null;
}

interface StoredCompatibilityReading {
  id: string;
  reading: unknown;
  createdAt: Date;
}

@Injectable()
export class CompatibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly baziService: BaziService
  ) {}

  async analyzeUserProfiles(userId: string, input: CreateCompatibilityRequest): Promise<CompatibilityReadingDto> {
    const { profileA, profileB } = await this.loadOwnedProfiles(userId, input);
    const [chartA, chartB] = await Promise.all([
      this.baziService.createChart(input.profileAId),
      this.baziService.createChart(input.profileBId)
    ]);
    const reading = buildCompatibilityReading(profileA, profileB, chartA, chartB);
    const saved = await this.prisma.compatibilityReading.create({
      data: {
        userId,
        profileAId: input.profileAId,
        profileBId: input.profileBId,
        chartAId: chartA.id,
        chartBId: chartB.id,
        overallScore: reading.overallScore,
        level: reading.level,
        reading: asPrismaJson(reading)
      }
    });
    return attachStoredFields(saved, reading);
  }

  async listUserReadings(userId: string): Promise<CompatibilityReadingListResponse> {
    const readings = await this.prisma.compatibilityReading.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: readingLimit
    });
    return {
      readings: readings.map(toCompatibilityReadingDto)
    };
  }

  async getUserReading(userId: string, readingId: string): Promise<CompatibilityReadingDto> {
    const reading = await this.prisma.compatibilityReading.findFirst({
      where: { id: readingId, userId }
    });
    if (!reading) {
      throw new NotFoundException("Compatibility reading not found");
    }
    return toCompatibilityReadingDto(reading);
  }

  async getPublicShareReading(readingId: string): Promise<PublicCompatibilityShareDto> {
    const reading = await this.prisma.compatibilityReading.findUnique({
      where: { id: readingId }
    });
    if (!reading) {
      throw new NotFoundException("Compatibility reading not found");
    }
    return toPublicCompatibilityShareDto(reading);
  }

  private async loadOwnedProfiles(
    userId: string,
    input: CreateCompatibilityRequest
  ): Promise<{ profileA: CompatibilityProfile; profileB: CompatibilityProfile }> {
    if (input.profileAId === input.profileBId) {
      throw new NotFoundException("Please choose two different profiles");
    }

    const profiles = await this.prisma.profile.findMany({
      where: { id: { in: [input.profileAId, input.profileBId] } },
      select: { id: true, userId: true, label: true, displayName: true }
    });
    if (profiles.length !== 2) {
      throw new NotFoundException("Profile not found");
    }
    if (profiles.some((profile) => profile.userId !== userId)) {
      throw new ForbiddenException("Profile does not belong to current user");
    }

    const profileA = profiles.find((profile) => profile.id === input.profileAId);
    const profileB = profiles.find((profile) => profile.id === input.profileBId);
    if (!profileA || !profileB) {
      throw new NotFoundException("Profile not found");
    }
    return { profileA, profileB };
  }
}

function buildCompatibilityReading(
  profileA: CompatibilityProfile,
  profileB: CompatibilityProfile,
  chartA: BaziChartDto,
  chartB: BaziChartDto
): Omit<CompatibilityReadingDto, "id" | "createdAt"> {
  const fiveElement = scoreFiveElement(chartA, chartB);
  const stems = scoreStems(chartA, chartB);
  const branches = scoreBranches(chartA, chartB);
  const dayMasters = scoreDayMasters(chartA, chartB);
  const overallScore = clampScore(Math.round(
    fiveElement.score * 0.35 + stems.score * 0.2 + branches.score * 0.25 + dayMasters.score * 0.2
  ));

  return {
    profiles: {
      a: { id: profileA.id, label: profileA.label ?? profileA.displayName ?? "命主 A" },
      b: { id: profileB.id, label: profileB.label ?? profileB.displayName ?? "命主 B" }
    },
    charts: {
      a: toChartSummary(chartA),
      b: toChartSummary(chartB)
    },
    overallScore,
    level: toLevel(overallScore),
    dimensions: {
      fiveElement,
      stems,
      branches,
      dayMasters
    },
    advantages: buildAdvantages(fiveElement, stems, branches, dayMasters),
    risks: buildRisks(fiveElement, stems, branches, dayMasters),
    advice: buildAdvice(chartA, chartB, overallScore),
    disclaimer: "合盘用于关系模式观察和沟通建议，不用于替代真实沟通、法律或医疗决策。"
  };
}

function scoreFiveElement(a: BaziChartDto, b: BaziChartDto): CompatibilityDimensionDto {
  const items: string[] = [];
  let score = 54;
  for (const element of Object.keys(elementLabels) as FiveElement[]) {
    const aValue = a.elements[element] ?? 0;
    const bValue = b.elements[element] ?? 0;
    const gap = Math.abs(aValue - bValue);
    if (gap >= 2) {
      score += 5;
      items.push(`${elementLabels[element]}气一方偏强、一方偏弱，存在互补空间`);
    } else {
      score += 2;
    }
  }
  const usefulOverlap = (a.usefulGods ?? []).filter((element) => (b.usefulGods ?? []).includes(element));
  if (usefulOverlap.length > 0) {
    score += 10;
    items.push(`共同喜${usefulOverlap.map((element) => elementLabels[element]).join("、")}，价值节奏更容易同频`);
  }
  if (items.length === 0) {
    items.push("五行分布较平稳，互补点不强但相处阻力也较低");
  }
  return {
    score: clampScore(score),
    summary: score >= 70 ? "五行互补明显，适合互相补位" : "五行互补中等，需要靠沟通补足节奏差",
    items
  };
}

function scoreStems(a: BaziChartDto, b: BaziChartDto): CompatibilityDimensionDto {
  const pairs = crossPairs(getStems(a), getStems(b));
  const combinations = pairs.map(([left, right]) => readPair(stemCombinations, left, right)).filter(Boolean) as string[];
  const clashes = pairs.map(([left, right]) => readPair(stemClashes, left, right)).filter(Boolean) as string[];
  const score = clampScore(60 + combinations.length * 8 - clashes.length * 7);
  return {
    score,
    summary: combinations.length >= clashes.length ? "天干互动偏合，外在表达容易互相吸引" : "天干冲动较多，容易在表达方式上较劲",
    items: [
      ...combinations.map((item) => `${item}，有吸引与协作感`),
      ...clashes.map((item) => `${item}，表达和决策节奏易冲突`),
      "天干代表外显互动，适合作为沟通风格参考"
    ]
  };
}

function scoreBranches(a: BaziChartDto, b: BaziChartDto): CompatibilityDimensionDto {
  const pairs = crossPairs(getBranches(a), getBranches(b));
  const combinations = pairs.map(([left, right]) => readPair(branchCombinations, left, right)).filter(Boolean) as string[];
  const clashes = pairs.map(([left, right]) => readPair(branchClashes, left, right)).filter(Boolean) as string[];
  const harms = pairs.map(([left, right]) => readPair(branchHarms, left, right)).filter(Boolean) as string[];
  const score = clampScore(58 + combinations.length * 7 - clashes.length * 8 - harms.length * 5);
  const items = [
    ...combinations.map((item) => `${item}，生活习惯与情绪节奏有贴近点`),
    ...clashes.map((item) => `${item}，现实安排和安全感容易拉扯`),
    ...harms.map((item) => `${item}，小事容易累积成误会`)
  ];
  return {
    score,
    summary: score >= 70 ? "地支合意较足，适合进入稳定协作" : "地支冲害需要留意，关系更需要规则感",
    items: items.length > 0 ? items : ["地支未见强烈合冲，关系更多取决于现实经营"]
  };
}

function scoreDayMasters(a: BaziChartDto, b: BaziChartDto): CompatibilityDimensionDto {
  const aElement = stemElements[a.dayMaster] ?? "wood";
  const bElement = stemElements[b.dayMaster] ?? "wood";
  let score = 60;
  const items: string[] = [`A 日主${a.dayMaster}属${elementLabels[aElement]}，B 日主${b.dayMaster}属${elementLabels[bElement]}`];
  if (generatingCycle[aElement] === bElement || generatingCycle[bElement] === aElement) {
    score += 20;
    items.push("日主形成相生关系，一方容易滋养另一方");
  } else if (controllingCycle[aElement] === bElement || controllingCycle[bElement] === aElement) {
    score -= 12;
    items.push("日主形成相克关系，吸引中带有控制感或压力感");
  } else if (aElement === bElement) {
    score += 8;
    items.push("日主同气，容易理解彼此的底层反应");
  } else {
    items.push("日主关系中性，需要看实际沟通和大运触发");
  }
  return {
    score: clampScore(score),
    summary: score >= 70 ? "日主关系有扶持感" : "日主关系需要减少控制和预设",
    items
  };
}

function getStems(chart: BaziChartDto): string[] {
  return [chart.pillars.year.stem, chart.pillars.month.stem, chart.pillars.day.stem, chart.pillars.hour.stem];
}

function getBranches(chart: BaziChartDto): string[] {
  return [chart.pillars.year.branch, chart.pillars.month.branch, chart.pillars.day.branch, chart.pillars.hour.branch];
}

function crossPairs(left: string[], right: string[]): Array<[string, string]> {
  return left.flatMap((leftItem) => right.map((rightItem): [string, string] => [leftItem, rightItem]));
}

function readPair(table: Record<string, string>, left: string, right: string): string | undefined {
  return table[`${left}${right}`] ?? table[`${right}${left}`];
}

function toChartSummary(chart: BaziChartDto): CompatibilityReadingDto["charts"]["a"] {
  return {
    id: chart.id,
    profileId: chart.profileId,
    dayMaster: chart.dayMaster,
    dayMasterStatus: chart.dayMasterStatus,
    mainPattern: chart.mainPattern,
    usefulGods: chart.usefulGods
  };
}

function toLevel(score: number): CompatibilityReadingDto["level"] {
  if (score >= 82) {
    return "excellent";
  }
  if (score >= 70) {
    return "good";
  }
  if (score >= 55) {
    return "balanced";
  }
  return "challenging";
}

function buildAdvantages(...dimensions: CompatibilityDimensionDto[]): string[] {
  return dimensions
    .filter((dimension) => dimension.score >= 65)
    .slice(0, 3)
    .map((dimension) => dimension.summary);
}

function buildRisks(...dimensions: CompatibilityDimensionDto[]): string[] {
  const risks = dimensions.filter((dimension) => dimension.score < 62).map((dimension) => dimension.summary);
  return risks.length > 0 ? risks : ["主要风险不在命盘结构，而在长期相处中是否愿意同步节奏"];
}

function buildAdvice(a: BaziChartDto, b: BaziChartDto, score: number): string[] {
  return [
    `A 的格局偏「${a.mainPattern}」，B 的格局偏「${b.mainPattern}」，先尊重彼此决策方式，再谈配合。`,
    score >= 70 ? "适合把共同目标具体化，越有计划越能放大互补优势。" : "先建立边界和沟通规则，再推进深度承诺。",
    "遇到冲突时少问谁对谁错，多问这件事触发了谁的安全感。"
  ];
}

function attachStoredFields(
  saved: { id: string; createdAt: Date },
  reading: Omit<CompatibilityReadingDto, "id" | "createdAt">
): CompatibilityReadingDto {
  return {
    id: saved.id,
    ...reading,
    createdAt: saved.createdAt.toISOString()
  };
}

function toCompatibilityReadingDto(stored: StoredCompatibilityReading): CompatibilityReadingDto {
  const reading = stored.reading as Omit<CompatibilityReadingDto, "id" | "createdAt">;
  return attachStoredFields(stored, reading);
}

function toPublicCompatibilityShareDto(stored: StoredCompatibilityReading): PublicCompatibilityShareDto {
  const reading = toCompatibilityReadingDto(stored);
  return {
    ...reading,
    profiles: {
      a: { label: reading.profiles.a.label },
      b: { label: reading.profiles.b.label }
    },
    charts: {
      a: {
        dayMaster: reading.charts.a.dayMaster,
        dayMasterStatus: reading.charts.a.dayMasterStatus,
        mainPattern: reading.charts.a.mainPattern,
        usefulGods: reading.charts.a.usefulGods
      },
      b: {
        dayMaster: reading.charts.b.dayMaster,
        dayMasterStatus: reading.charts.b.dayMasterStatus,
        mainPattern: reading.charts.b.mainPattern,
        usefulGods: reading.charts.b.usefulGods
      }
    }
  };
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}
