import type { BaziChartDto, BaziStrengthLevel, FiveElement } from "@metamystic/shared";

const RULE_VERSION = "bazi-rules-3.0.0";
const pillarNames = ["year", "month", "day", "hour"] as const;
const displayPillarNames = { year: "年柱", month: "月柱", day: "日柱", hour: "时柱" } as const;

const stemElements: Record<string, FiveElement> = {
  甲: "wood", 乙: "wood", 丙: "fire", 丁: "fire", 戊: "earth",
  己: "earth", 庚: "metal", 辛: "metal", 壬: "water", 癸: "water"
};
const stemPolarity: Record<string, "yang" | "yin"> = {
  甲: "yang", 乙: "yin", 丙: "yang", 丁: "yin", 戊: "yang",
  己: "yin", 庚: "yang", 辛: "yin", 壬: "yang", 癸: "yin"
};
const generates: Record<FiveElement, FiveElement> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood"
};
const generatedBy: Record<FiveElement, FiveElement> = {
  wood: "water", fire: "wood", earth: "fire", metal: "earth", water: "metal"
};
const controls: Record<FiveElement, FiveElement> = {
  wood: "earth", fire: "metal", earth: "water", metal: "wood", water: "fire"
};
const controlledBy: Record<FiveElement, FiveElement> = {
  wood: "metal", fire: "water", earth: "wood", metal: "fire", water: "earth"
};
const hiddenQi: Record<string, Array<[string, number]>> = {
  子: [["癸", 1]], 丑: [["己", 0.6], ["癸", 0.3], ["辛", 0.1]],
  寅: [["甲", 0.6], ["丙", 0.3], ["戊", 0.1]], 卯: [["乙", 1]],
  辰: [["戊", 0.6], ["乙", 0.3], ["癸", 0.1]], 巳: [["丙", 0.6], ["戊", 0.3], ["庚", 0.1]],
  午: [["丁", 0.7], ["己", 0.3]], 未: [["己", 0.6], ["丁", 0.3], ["乙", 0.1]],
  申: [["庚", 0.6], ["壬", 0.3], ["戊", 0.1]], 酉: [["辛", 1]],
  戌: [["戊", 0.6], ["辛", 0.3], ["丁", 0.1]], 亥: [["壬", 0.7], ["甲", 0.3]]
};

type Pillars = BaziChartDto["pillars"];
type Relation = NonNullable<NonNullable<BaziChartDto["analysis"]>["relations"]>[number];
type UsefulMethod = NonNullable<NonNullable<BaziChartDto["analysis"]>["usefulGodMethods"]>[number];

export interface BaziRulesV3Result {
  ruleVersion: typeof RULE_VERSION;
  strength: {
    score: number;
    level: BaziStrengthLevel;
    confidence: number;
    controversy: string;
    usedPillars: number;
    evidence: NonNullable<NonNullable<BaziChartDto["analysis"]>["strengthEvidence"]>;
  };
  pattern: { name: string; confidence: number; evidence: string[] };
  usefulGodMethods: UsefulMethod[];
  relations: Relation[];
}

export function analyzeBaziRulesV3(input: {
  dayMaster: string;
  pillars: Pillars;
  hourPillarReliable: boolean;
}): BaziRulesV3Result {
  const dayElement = stemElements[input.dayMaster] ?? "earth";
  const resourceElement = generatedBy[dayElement];
  const activeNames = input.hourPillarReliable ? pillarNames : pillarNames.slice(0, 3);
  const activePillars = activeNames.map((name) => input.pillars[name]);
  const monthMainStem = hiddenQi[input.pillars.month.branch]?.[0]?.[0] ?? input.pillars.month.hiddenStems[0] ?? "戊";
  const monthElement = stemElements[monthMainStem] ?? "earth";
  const seasonFactor = supportFactor(monthElement, dayElement, resourceElement);
  const seasonScore = round(40 * seasonFactor);

  const rootSupport = activePillars.reduce((sum, pillar) => sum + hiddenSupport(pillar.branch, dayElement, resourceElement), 0);
  const rootsScore = round(30 * rootSupport / activePillars.length);

  let momentumSupport = 0;
  let momentumTotal = 0;
  activePillars.forEach((pillar, index) => {
    if (index !== 2) {
      momentumSupport += supportFactor(stemElements[pillar.stem] ?? "earth", dayElement, resourceElement);
      momentumTotal += 1;
    }
    for (const [stem, weight] of hiddenQi[pillar.branch] ?? []) {
      momentumSupport += supportFactor(stemElements[stem] ?? "earth", dayElement, resourceElement) * weight;
      momentumTotal += weight;
    }
  });
  const momentumScore = round(30 * momentumSupport / Math.max(momentumTotal, 1));
  const relations = calculateRelations(input.pillars, activeNames, dayElement, resourceElement);
  const relationAdjustment = clamp(relations.reduce((sum, relation) => sum + relation.adjustment, 0), -10, 10);
  const score = round(clamp(seasonScore + rootsScore + momentumScore + relationAdjustment, 0, 100));
  const level = strengthLevel(score);
  const confidence = input.hourPillarReliable ? 0.86 : 0.72;
  const pattern = calculatePattern(input.dayMaster, input.pillars, activeNames, monthMainStem);
  const usefulGodMethods = calculateUsefulGodMethods(dayElement, input.pillars.month.branch, level, pattern.name);

  return {
    ruleVersion: RULE_VERSION,
    strength: {
      score,
      level,
      confidence,
      controversy: "旺衰、格局与喜用存在流派差异；本结果公开规则权重，不作为唯一命理解法。",
      usedPillars: activePillars.length,
      evidence: [
        { dimension: "season", score: seasonScore, maxScore: 40, evidence: [`月令主气${monthMainStem}属${monthElement}，得令权重按 40 分计算。`] },
        { dimension: "roots", score: rootsScore, maxScore: 30, evidence: [`${activePillars.length}柱根气按本气、中气、余气权重重新归一化。`] },
        { dimension: "momentum", score: momentumScore, maxScore: 30, evidence: ["天干与藏干中的印比助力、泄耗克制按同一量表计算。"] },
        { dimension: "relations", score: relationAdjustment, maxScore: 10, evidence: relations.length ? relations.map((item) => item.evidence) : ["未发现改变旺衰判断的主要合冲刑害。"] }
      ]
    },
    pattern,
    usefulGodMethods,
    relations
  };
}

function supportFactor(element: FiveElement, day: FiveElement, resource: FiveElement): number {
  if (element === day) return 1;
  if (element === resource) return 0.8;
  if (element === generates[day] || element === controls[day]) return 0.2;
  if (element === controlledBy[day]) return 0;
  return 0.35;
}

function hiddenSupport(branch: string, day: FiveElement, resource: FiveElement): number {
  return (hiddenQi[branch] ?? []).reduce((sum, [stem, weight]) => {
    const element = stemElements[stem] ?? "earth";
    const factor = element === day ? 1 : element === resource ? 0.6 : 0;
    return sum + weight * factor;
  }, 0);
}

function strengthLevel(score: number): BaziStrengthLevel {
  if (score < 25) return "veryWeak";
  if (score < 42) return "weak";
  if (score <= 58) return "balanced";
  if (score <= 75) return "strong";
  return "veryStrong";
}

function calculatePattern(dayMaster: string, pillars: Pillars, activeNames: readonly (typeof pillarNames)[number][], monthMainStem: string) {
  const monthTenGod = tenGod(dayMaster, monthMainStem);
  const exposed = activeNames.some((name) => name !== "day" && pillars[name].stem === monthMainStem);
  const evidence = [`月令主气为${monthMainStem}，对应十神${monthTenGod}。`];
  if (!exposed) {
    evidence.push("月令主气未透天干，暂不强行定格。");
    return { name: "格局未定", confidence: 0.48, evidence };
  }
  evidence.push(`月令主气${monthMainStem}已透天干，具备定格基础。`);
  const dayElement = stemElements[dayMaster] ?? "earth";
  const hasResource = activeNames.some((name) => {
    const god = tenGod(dayMaster, pillars[name].stem);
    return god === "正印" || god === "偏印";
  });
  if (monthTenGod === "七杀" && hasResource) {
    evidence.push("同时见印星承接七杀，形成制化依据。 ");
    return { name: "杀印相生", confidence: 0.84, evidence };
  }
  const luBranches: Record<string, string> = { 甲: "寅", 乙: "卯", 丙: "巳", 丁: "午", 戊: "巳", 己: "午", 庚: "申", 辛: "酉", 壬: "亥", 癸: "子" };
  if (monthTenGod === "比肩" && luBranches[dayMaster] === pillars.month.branch) {
    return { name: "建禄格", confidence: 0.8, evidence };
  }
  void dayElement;
  return { name: `${monthTenGod}格`, confidence: 0.76, evidence };
}

function calculateUsefulGodMethods(
  day: FiveElement,
  monthBranch: string,
  level: BaziStrengthLevel,
  pattern: string
): UsefulMethod[] {
  const weak = level === "weak" || level === "veryWeak";
  const strong = level === "strong" || level === "veryStrong";
  const fuyiFavorable = weak ? [generatedBy[day], day] : strong ? [generates[day], controls[day]] : [generates[day], generatedBy[day]];
  const fuyiUnfavorable = weak ? [controlledBy[day], controls[day]] : strong ? [day, generatedBy[day]] : [controlledBy[day]];
  const winter = ["亥", "子", "丑"].includes(monthBranch);
  const summer = ["巳", "午", "未"].includes(monthBranch);
  const tiaohouFavorable: FiveElement[] = winter ? ["fire", "wood"] : summer ? ["water", "metal"] : ["fire", "water"];
  const patternFavorable: FiveElement[] = pattern.includes("杀") || pattern.includes("官")
    ? [generatedBy[day]]
    : pattern.includes("食") || pattern.includes("伤")
      ? [controls[day]]
      : [generates[day]];
  const conflict = fuyiFavorable[0] !== tiaohouFavorable[0]
    ? "扶抑与调候首选不同，应并列参考，不合并成唯一用神。"
    : undefined;
  return [
    method("扶抑", fuyiFavorable, fuyiUnfavorable, 0.82, [`依据${level}等级平衡印比与泄耗克。`], conflict),
    method("调候", tiaohouFavorable, summer ? ["fire"] : winter ? ["water"] : [], 0.68, [`月支${monthBranch}按寒暖燥湿处理。`], conflict),
    method("格局", patternFavorable, [], pattern === "格局未定" ? 0.45 : 0.74, [`当前格局判断：${pattern}。`]),
    method("通关", [generatedBy[day]], [controlledBy[day]], 0.62, ["以生扶日主的印星五行缓冲克制链条。"])
  ];
}

function method(
  methodName: UsefulMethod["method"],
  favorable: FiveElement[],
  unfavorable: FiveElement[],
  confidence: number,
  evidence: string[],
  conflictNote?: string
): UsefulMethod {
  return { method: methodName, favorable: unique(favorable), unfavorable: unique(unfavorable), confidence, evidence, ...(conflictNote ? { conflictNote } : {}) };
}

function calculateRelations(
  pillars: Pillars,
  activeNames: readonly (typeof pillarNames)[number][],
  day: FiveElement,
  resource: FiveElement
): Relation[] {
  const pairMaps: Array<{ type: Relation["type"]; pairs: string[]; adjustment: number }> = [
    { type: "combine", pairs: ["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"], adjustment: 1.5 },
    { type: "clash", pairs: ["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"], adjustment: -2 },
    { type: "punishment", pairs: ["子卯", "寅巳", "巳申", "申寅", "丑戌", "戌未", "未丑"], adjustment: -1.5 },
    { type: "harm", pairs: ["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"], adjustment: -1 }
  ];
  const relations: Relation[] = [];
  for (let left = 0; left < activeNames.length; left += 1) {
    for (let right = left + 1; right < activeNames.length; right += 1) {
      const leftName = activeNames[left]!;
      const rightName = activeNames[right]!;
      const branches: [string, string] = [pillars[leftName].branch, pillars[rightName].branch];
      for (const definition of pairMaps) {
        if (!definition.pairs.includes(branches.join("")) && !definition.pairs.includes([...branches].reverse().join(""))) continue;
        const supports = branches.some((branch) => {
          const element = stemElements[hiddenQi[branch]?.[0]?.[0] ?? ""];
          return element === day || element === resource;
        });
        const adjustment = definition.type === "combine" && !supports ? 0.5 : definition.adjustment;
        relations.push({
          pillars: [displayPillarNames[leftName], displayPillarNames[rightName]],
          branches,
          type: definition.type,
          adjustment,
          evidence: `${displayPillarNames[leftName]}${branches[0]}与${displayPillarNames[rightName]}${branches[1]}形成${relationLabel(definition.type)}。`
        });
      }
    }
  }
  return relations;
}

function tenGod(dayStem: string, targetStem: string): string {
  const day = stemElements[dayStem] ?? "earth";
  const target = stemElements[targetStem] ?? "earth";
  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];
  if (target === day) return samePolarity ? "比肩" : "劫财";
  if (target === generates[day]) return samePolarity ? "食神" : "伤官";
  if (target === controls[day]) return samePolarity ? "偏财" : "正财";
  if (target === controlledBy[day]) return samePolarity ? "七杀" : "正官";
  if (target === generatedBy[day]) return samePolarity ? "偏印" : "正印";
  return "日主";
}

function relationLabel(type: Relation["type"]): string {
  return { combine: "六合", clash: "相冲", punishment: "相刑", harm: "相害" }[type];
}
function unique<T>(values: T[]): T[] { return [...new Set(values)]; }
function clamp(value: number, minimum: number, maximum: number): number { return Math.max(minimum, Math.min(maximum, value)); }
function round(value: number): number { return Number(value.toFixed(2)); }
