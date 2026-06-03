import type { BaziChartDto, BaziPillarDto, FiveElement } from "@metamystic/shared";
import type { CalculatedBaziChart } from "./bazi-engine";

const stems = ["\u7532", "\u4e59", "\u4e19", "\u4e01", "\u620a", "\u5df1", "\u5e9a", "\u8f9b", "\u58ec", "\u7678"] as const;

const stemElements: Record<string, FiveElement> = {
  "\u7532": "wood",
  "\u4e59": "wood",
  "\u4e19": "fire",
  "\u4e01": "fire",
  "\u620a": "earth",
  "\u5df1": "earth",
  "\u5e9a": "metal",
  "\u8f9b": "metal",
  "\u58ec": "water",
  "\u7678": "water"
};

const stemPolarity: Record<string, "yang" | "yin"> = {
  "\u7532": "yang",
  "\u4e59": "yin",
  "\u4e19": "yang",
  "\u4e01": "yin",
  "\u620a": "yang",
  "\u5df1": "yin",
  "\u5e9a": "yang",
  "\u8f9b": "yin",
  "\u58ec": "yang",
  "\u7678": "yin"
};

const branchElements: Record<string, FiveElement> = {
  "\u5b50": "water",
  "\u4e11": "earth",
  "\u5bc5": "wood",
  "\u536f": "wood",
  "\u8fb0": "earth",
  "\u5df3": "fire",
  "\u5348": "fire",
  "\u672a": "earth",
  "\u7533": "metal",
  "\u9149": "metal",
  "\u620c": "earth",
  "\u4ea5": "water"
};

const generatedBy: Record<FiveElement, FiveElement> = {
  wood: "water",
  fire: "wood",
  earth: "fire",
  metal: "earth",
  water: "metal"
};

const generates: Record<FiveElement, FiveElement> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood"
};

const controls: Record<FiveElement, FiveElement> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire"
};

const controlledBy: Record<FiveElement, FiveElement> = {
  wood: "metal",
  fire: "water",
  earth: "wood",
  metal: "fire",
  water: "earth"
};

const tenGodPriority = [
  "\u4e03\u6740",
  "\u4f24\u5b98",
  "\u6b63\u5b98",
  "\u504f\u8d22",
  "\u6b63\u8d22",
  "\u98df\u795e",
  "\u504f\u5370",
  "\u6b63\u5370",
  "\u52ab\u8d22",
  "\u6bd4\u80a9"
];

const elementLabels: Record<FiveElement, string> = {
  wood: "\u6728",
  fire: "\u706b",
  earth: "\u571f",
  metal: "\u91d1",
  water: "\u6c34"
};

const seasonalSupportLabels: Record<
  NonNullable<NonNullable<BaziChartDto["analysis"]>["strength"]>["seasonalSupport"],
  string
> = {
  supporting: "\u5f97\u4ee4\u6216\u53d7\u751f",
  draining: "\u6cc4\u8017",
  controlling: "\u514b\u5236",
  neutral: "\u4e2d\u6027"
};

export function enrichProfessionalBaziChart<T extends CalculatedBaziChart | BaziChartDto>(
  chart: T
): T & Pick<BaziChartDto, "pillars" | "usefulGods" | "unfavorableGods" | "analysis" | "metadata"> {
  const usefulGods = inferUsefulGods(chart.dayMaster, chart.dayMasterStatus);
  const unfavorableGods = inferUnfavorableGods(chart.dayMaster, chart.dayMasterStatus);
  const pillars = {
    year: enrichPillar(chart.pillars.year, chart.dayMaster),
    month: enrichPillar(chart.pillars.month, chart.dayMaster),
    day: enrichPillar(chart.pillars.day, chart.dayMaster),
    hour: enrichPillar(chart.pillars.hour, chart.dayMaster)
  };
  const analysis = buildBaziAnalysis({ ...chart, pillars }, usefulGods, unfavorableGods);
  return {
    ...chart,
    pillars,
    usefulGods,
    unfavorableGods,
    analysis,
    metadata: {
      ...(chart.metadata ?? {}),
      analysis,
      professional: {
        usefulGods,
        unfavorableGods,
        note: "\u559c\u7528\u795e\u4e3a MVP \u89c4\u5219\u63a8\u65ad\uff0c\u6b63\u5f0f\u7248\u9700\u7ed3\u5408\u6708\u4ee4\u3001\u683c\u5c40\u3001\u901a\u5173\u548c\u8c03\u5019\u7ec6\u5316\u3002"
      }
    }
  } as T & Pick<BaziChartDto, "pillars" | "usefulGods" | "unfavorableGods" | "analysis" | "metadata">;
}

export function getTenGod(dayStem: string, targetStem: string): string {
  const dayElement = stemElements[dayStem] ?? "earth";
  const targetElement = stemElements[targetStem] ?? "earth";
  const samePolarity = stemPolarity[dayStem] === stemPolarity[targetStem];

  if (targetElement === dayElement) {
    return samePolarity ? "\u6bd4\u80a9" : "\u52ab\u8d22";
  }
  if (targetElement === generates[dayElement]) {
    return samePolarity ? "\u98df\u795e" : "\u4f24\u5b98";
  }
  if (targetElement === controls[dayElement]) {
    return samePolarity ? "\u504f\u8d22" : "\u6b63\u8d22";
  }
  if (targetElement === controlledBy[dayElement]) {
    return samePolarity ? "\u4e03\u6740" : "\u6b63\u5b98";
  }
  if (targetElement === generatedBy[dayElement]) {
    return samePolarity ? "\u504f\u5370" : "\u6b63\u5370";
  }
  return "\u65e5\u4e3b";
}

function enrichPillar(pillar: BaziPillarDto, dayMaster: string): BaziPillarDto {
  return {
    ...pillar,
    hiddenStemDetails: pillar.hiddenStems.map((stem) => ({
      stem,
      tenGod: getTenGod(dayMaster, stem),
      element: stemElements[stem] ?? "earth"
    }))
  };
}

function inferUsefulGods(dayMaster: string, status: BaziChartDto["dayMasterStatus"]): FiveElement[] {
  const dayElement = stemElements[dayMaster] ?? "earth";
  if (status === "weak") {
    return [generatedBy[dayElement], dayElement];
  }
  if (status === "strong") {
    return [generates[dayElement], controls[dayElement]];
  }
  return [generates[dayElement], generatedBy[dayElement]];
}

function inferUnfavorableGods(dayMaster: string, status: BaziChartDto["dayMasterStatus"]): FiveElement[] {
  const dayElement = stemElements[dayMaster] ?? "earth";
  if (status === "weak") {
    return [controlledBy[dayElement], controls[dayElement]];
  }
  if (status === "strong") {
    return [dayElement, generatedBy[dayElement]];
  }
  return [controlledBy[dayElement]];
}

export function normalizeStem(stem: string): string {
  return stems.includes(stem as (typeof stems)[number]) ? stem : "\u4e59";
}

function buildBaziAnalysis(
  chart: CalculatedBaziChart | BaziChartDto,
  usefulGods: FiveElement[],
  unfavorableGods: FiveElement[]
): NonNullable<BaziChartDto["analysis"]> {
  const dayElement = stemElements[chart.dayMaster] ?? "earth";
  const dayElementRatio = chart.elements[dayElement] ?? 0;
  const supporter = generatedBy[dayElement];
  const supportRatio = chart.elements[supporter] ?? 0;
  const draining = generates[dayElement];
  const wealth = controls[dayElement];
  const officer = controlledBy[dayElement];
  const pressureRatio = (chart.elements[draining] ?? 0) + (chart.elements[wealth] ?? 0) + (chart.elements[officer] ?? 0);
  const rawScore = Math.round((dayElementRatio + supportRatio - pressureRatio + 1) * 50);
  const strengthScore = Math.max(0, Math.min(100, rawScore));
  const professional = buildProfessionalAnalysis(chart, usefulGods, unfavorableGods, strengthScore);
  const strengthLabel = {
    strong: "\u8eab\u5f3a",
    balanced: "\u4e2d\u548c",
    weak: "\u8eab\u5f31"
  }[chart.dayMasterStatus];
  const reasons = buildStrengthReasons(chart.dayMasterStatus, dayElementRatio, supportRatio, pressureRatio);

  if (chart.dayMasterStatus === "weak") {
    return {
      strengthScore,
      strengthLabel,
      strengthReasons: reasons,
      ...professional,
      favorableStrategy: `\u4ee5${formatElements(usefulGods)}\u4e3a\u4e3b\u8f74\uff0c\u5148\u627f\u6258\u65e5\u4e3b\uff0c\u518d\u627f\u63a5\u8d22\u5b98\u538b\u529b\u3002`,
      personality: "\u654f\u611f\u5ea6\u9ad8\uff0c\u5584\u4e8e\u89c2\u5bdf\u548c\u914d\u5408\uff0c\u9047\u5230\u9ad8\u538b\u573a\u666f\u9700\u5148\u627e\u5230\u652f\u6491\u7cfb\u7edf\u3002",
      career: "\u5148\u5efa\u7acb\u4e13\u4e1a\u4fe1\u4efb\u548c\u8d44\u6e90\u540e\u518d\u6269\u5f20\uff0c\u9002\u5408\u5bfc\u5e08\u3001\u5e73\u53f0\u3001\u8bc1\u4e66\u6216\u77e5\u8bc6\u578b\u8def\u5f84\u52a0\u6301\u3002",
      wealth: "\u8d22\u52a1\u4e0a\u4e0d\u5b9c\u8fc7\u5ea6\u6760\u6746\uff0c\u5148\u7559\u73b0\u91d1\u6d41\u548c\u5b89\u5168\u57ab\uff0c\u518d\u505a\u6536\u76ca\u6269\u5f20\u3002",
      relationship: "\u5173\u7cfb\u4e2d\u5bb9\u6613\u88ab\u5bf9\u65b9\u8282\u594f\u5e26\u52a8\uff0c\u9700\u8981\u660e\u786e\u8fb9\u754c\u548c\u4e3b\u52a8\u8868\u8fbe\u9700\u6c42\u3002",
      health: "\u6ce8\u610f\u538b\u529b\u6062\u590d\u3001\u7761\u7720\u548c\u957f\u671f\u8017\u80fd\uff0c\u5c11\u7528\u610f\u5fd7\u529b\u786c\u625b\u3002"
    };
  }

  if (chart.dayMasterStatus === "strong") {
    return {
      strengthScore,
      strengthLabel,
      strengthReasons: reasons,
      ...professional,
      favorableStrategy: `\u4ee5${formatElements(usefulGods)}\u4e3a\u7528\uff0c\u628a\u65e5\u4e3b\u80fd\u91cf\u5bfc\u5411\u4ea7\u51fa\u3001\u89c4\u5219\u548c\u8d44\u6e90\u4ea4\u6362\u3002`,
      personality: "\u4e3b\u89c1\u5f3a\u3001\u884c\u52a8\u5feb\uff0c\u9002\u5408\u627f\u62c5\u4e3b\u5bfc\u89d2\u8272\uff0c\u4f46\u8981\u907f\u514d\u8fc7\u5ea6\u81ea\u6211\u548c\u786c\u63a8\u3002",
      career: "\u9002\u5408\u628a\u80fd\u91cf\u6295\u5165\u7ba1\u7406\u3001\u4ea7\u54c1\u3001\u9500\u552e\u6216\u8d44\u6e90\u6574\u5408\uff0c\u9700\u8981\u7528\u5236\u5ea6\u548c\u76ee\u6807\u7ea6\u675f\u8282\u594f\u3002",
      wealth: "\u80fd\u627f\u8d22\uff0c\u4f46\u8981\u8ba9\u98ce\u9669\u548c\u73b0\u91d1\u6d41\u6709\u4e0a\u9650\uff0c\u4e0d\u5b9c\u4e00\u65f6\u5174\u8d77\u6269\u5f20\u8fc7\u5feb\u3002",
      relationship: "\u5173\u7cfb\u91cc\u5bb9\u6613\u7ad9\u5230\u4e3b\u5bfc\u4f4d\uff0c\u591a\u542c\u53d6\u53cd\u9988\u4f1a\u8ba9\u4eb2\u5bc6\u611f\u66f4\u7a33\u3002",
      health: "\u6ce8\u610f\u706b\u6c14\u3001\u6025\u8e81\u548c\u8fc7\u52b3\uff0c\u9700\u8981\u7a33\u5b9a\u8fd0\u52a8\u6765\u6cc4\u529b\u3002"
    };
  }

  return {
    strengthScore,
    strengthLabel,
    strengthReasons: reasons,
    ...professional,
    favorableStrategy: `\u547d\u5c40\u8f83\u4e3a\u4e2d\u548c\uff0c\u559c${formatElements(usefulGods)}\u5e2e\u52a9\u6d41\u901a\uff0c\u5fcc${formatElements(unfavorableGods)}\u6253\u7834\u5e73\u8861\u3002`,
    personality: "\u8c03\u548c\u529b\u8f83\u597d\uff0c\u80fd\u5728\u81ea\u6211\u4e3b\u5f20\u548c\u73af\u5883\u8981\u6c42\u4e4b\u95f4\u627e\u5e73\u8861\u3002",
    career: "\u9002\u5408\u7a33\u5b9a\u79ef\u7d2f\u3001\u6301\u7eed\u8fed\u4ee3\u7684\u8def\u5f84\uff0c\u4e0d\u5fc5\u8ffd\u6c42\u6781\u7aef\u5192\u8fdb\u3002",
    wealth: "\u8d22\u52a1\u4ee5\u7a33\u5b9a\u590d\u5229\u4e3a\u4f73\uff0c\u53ef\u5728\u719f\u6089\u9886\u57df\u9010\u6b65\u52a0\u4ed3\u3002",
    relationship: "\u5173\u7cfb\u4e2d\u6709\u4e92\u8865\u7a7a\u95f4\uff0c\u9002\u5408\u627e\u8282\u594f\u7a33\u5b9a\u3001\u80fd\u4e00\u8d77\u89c4\u5212\u7684\u5bf9\u8c61\u3002",
    health: "\u4fdd\u6301\u89c4\u5f8b\u4f5c\u606f\u5373\u53ef\uff0c\u5c11\u5728\u9ad8\u538b\u671f\u8fde\u7eed\u900f\u652f\u3002"
  };
}

function buildProfessionalAnalysis(
  chart: CalculatedBaziChart | BaziChartDto,
  usefulGods: FiveElement[],
  unfavorableGods: FiveElement[],
  strengthScore: number
): Pick<
  NonNullable<BaziChartDto["analysis"]>,
  | "strength"
  | "tenGodDistribution"
  | "usefulGodDetails"
  | "unfavorableGodDetails"
  | "pattern"
  | "riskFlags"
> {
  const dayElement = stemElements[chart.dayMaster] ?? "earth";
  const resourceElement = generatedBy[dayElement];
  const outputElement = generates[dayElement];
  const wealthElement = controls[dayElement];
  const officerElement = controlledBy[dayElement];
  const monthElement = branchElements[chart.pillars.month.branch] ?? "earth";
  const dayElementRatio = chart.elements[dayElement] ?? 0;
  const resourceRatio = chart.elements[resourceElement] ?? 0;
  const peerRatio = dayElementRatio;
  const outputRatio = chart.elements[outputElement] ?? 0;
  const wealthRatio = chart.elements[wealthElement] ?? 0;
  const officerRatio = chart.elements[officerElement] ?? 0;
  const supportScore = Number((resourceRatio + peerRatio).toFixed(2));
  const pressureScore = Number((outputRatio + wealthRatio + officerRatio).toFixed(2));
  const seasonalSupport = getSeasonalSupport(dayElement, monthElement);
  const level = getStrengthLevel(chart.dayMasterStatus, strengthScore, supportScore);
  const tenGodDistribution = buildTenGodDistribution(chart);
  const riskFlags = buildRiskFlags(chart.dayMasterStatus, officerRatio, wealthRatio, outputRatio, supportScore);
  const evidence = [
    `\u6708\u4ee4\u4e94\u884c\u4e3a${elementLabels[monthElement]}\uff0c\u5bf9\u65e5\u4e3b\u5448\u73b0${seasonalSupportLabels[seasonalSupport]}\u3002`,
    `\u5370\u6bd4\u652f\u6301\u7ea6 ${Math.round(supportScore * 100)}%\uff0c\u6cc4\u8017\u514b\u538b\u529b\u7ea6 ${Math.round(pressureScore * 100)}%\u3002`,
    `\u4e3b\u8981\u5341\u795e\u4e3a${tenGodDistribution.dominantTenGods.join("\u3001")}\u3002`
  ];

  return {
    strength: {
      score: strengthScore,
      level,
      supportScore,
      pressureScore,
      seasonalSupport,
      dayElementRatio,
      resourceRatio,
      peerRatio,
      outputRatio,
      wealthRatio,
      officerRatio,
      reasons: evidence
    },
    tenGodDistribution,
    usefulGodDetails: usefulGods.map((element) => buildGodDetail(element, "\u559c\u795e", chart.dayMasterStatus)),
    unfavorableGodDetails: unfavorableGods.map((element) =>
      buildGodDetail(element, "\u5fcc\u795e", chart.dayMasterStatus)
    ),
    pattern: {
      name: chart.mainPattern,
      confidence: getPatternConfidence(chart.dayMasterStatus, supportScore, pressureScore, seasonalSupport),
      evidence,
      strategySummary: buildStrategySummary(chart.dayMasterStatus, usefulGods, unfavorableGods)
    },
    riskFlags
  };
}

function buildTenGodDistribution(chart: CalculatedBaziChart | BaziChartDto): NonNullable<
  NonNullable<BaziChartDto["analysis"]>["tenGodDistribution"]
> {
  const weights: Record<string, number> = {};
  const add = (tenGod: string, weight: number): void => {
    weights[tenGod] = Number(((weights[tenGod] ?? 0) + weight).toFixed(2));
  };
  const pillars = [chart.pillars.year, chart.pillars.month, chart.pillars.day, chart.pillars.hour];

  for (const [index, pillar] of pillars.entries()) {
    if (index !== 2) {
      add(pillar.tenGod, 1);
    }
    for (const hidden of pillar.hiddenStemDetails ?? []) {
      add(hidden.tenGod, 0.5);
    }
  }

  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const percentages = Object.fromEntries(
    Object.entries(weights).map(([tenGod, weight]) => [tenGod, Number((weight / total).toFixed(2))])
  );
  const dominantTenGods = Object.entries(weights)
    .sort(([leftGod, leftWeight], [rightGod, rightWeight]) => {
      if (rightWeight !== leftWeight) {
        return rightWeight - leftWeight;
      }
      return tenGodPriority.indexOf(leftGod) - tenGodPriority.indexOf(rightGod);
    })
    .slice(0, 3)
    .map(([tenGod]) => tenGod);

  return {
    weights,
    percentages,
    dominantTenGods,
    interpretation: `\u547d\u5c40\u5341\u795e\u4ee5${dominantTenGods.join("\u3001")}\u4e3a\u4e3b\uff0c\u5206\u6790\u65f6\u5e94\u4f18\u5148\u89c2\u5bdf\u8fd9\u4e9b\u529b\u91cf\u5bf9\u4e8b\u4e1a\u3001\u5173\u7cfb\u548c\u98ce\u9669\u51b3\u7b56\u7684\u5f71\u54cd\u3002`
  };
}

function getSeasonalSupport(
  dayElement: FiveElement,
  monthElement: FiveElement
): NonNullable<NonNullable<BaziChartDto["analysis"]>["strength"]>["seasonalSupport"] {
  if (monthElement === dayElement || generates[monthElement] === dayElement) {
    return "supporting";
  }
  if (generates[dayElement] === monthElement || controls[dayElement] === monthElement) {
    return "draining";
  }
  if (controls[monthElement] === dayElement) {
    return "controlling";
  }
  return "neutral";
}

function getStrengthLevel(
  status: BaziChartDto["dayMasterStatus"],
  strengthScore: number,
  supportScore: number
): string {
  if (status === "weak") {
    return strengthScore <= 15 && supportScore < 0.25 ? "\u8eab\u5f31" : "\u504f\u5f31";
  }
  if (status === "strong") {
    return strengthScore >= 80 ? "\u8eab\u5f3a" : "\u504f\u5f3a";
  }
  return "\u4e2d\u548c";
}

function buildGodDetail(
  element: FiveElement,
  role: "\u559c\u795e" | "\u5fcc\u795e",
  status: BaziChartDto["dayMasterStatus"]
): NonNullable<NonNullable<BaziChartDto["analysis"]>["usefulGodDetails"]>[number] {
  const label = elementLabels[element];
  const isUseful = role === "\u559c\u795e";
  return {
    element,
    label,
    role,
    reason: isUseful
      ? `${label}\u80fd\u591f${status === "strong" ? "\u758f\u5bfc\u8fc7\u65fa\u65e5\u4e3b" : "\u627f\u6258\u6216\u6d41\u901a\u65e5\u4e3b"}\uff0c\u662f\u5f53\u524d\u547d\u5c40\u7684\u4f18\u5148\u7528\u529b\u65b9\u5411\u3002`
      : `${label}\u5bb9\u6613\u653e\u5927\u5f53\u524d\u547d\u5c40\u7684\u5931\u8861\u70b9\uff0c\u9700\u8981\u7528\u8282\u594f\u548c\u8fb9\u754c\u7ba1\u63a7\u3002`,
    advice: isUseful
      ? `\u751f\u6d3b\u548c\u51b3\u7b56\u4e0a\u53ef\u589e\u52a0${label}\u7684\u8c61\u610f\uff1a\u8d44\u6e90\u3001\u8282\u594f\u3001\u73af\u5883\u6216\u884c\u4e3a\u504f\u597d\u3002`
      : `\u9047\u5230${label}\u8fc7\u91cd\u7684\u573a\u666f\u65f6\uff0c\u5148\u964d\u4f4e\u66b4\u9732\uff0c\u518d\u7528\u559c\u7528\u795e\u65b9\u5411\u505a\u5e73\u8861\u3002`
  };
}

function buildRiskFlags(
  status: BaziChartDto["dayMasterStatus"],
  officerRatio: number,
  wealthRatio: number,
  outputRatio: number,
  supportScore: number
): string[] {
  const flags: string[] = [];
  if (status === "weak" && officerRatio >= 0.25) {
    flags.push("\u5b98\u6740\u538b\u529b\u504f\u91cd");
  }
  if (status === "weak" && wealthRatio >= 0.22) {
    flags.push("\u8d22\u661f\u8017\u8eab\u660e\u663e");
  }
  if (status === "strong" && supportScore >= 0.55) {
    flags.push("\u5370\u6bd4\u8fc7\u65fa");
  }
  if (outputRatio >= 0.3) {
    flags.push("\u98df\u4f24\u8868\u8fbe\u8fc7\u5f3a");
  }
  return flags;
}

function getPatternConfidence(
  status: BaziChartDto["dayMasterStatus"],
  supportScore: number,
  pressureScore: number,
  seasonalSupport: NonNullable<NonNullable<BaziChartDto["analysis"]>["strength"]>["seasonalSupport"]
): number {
  const statusWeight = status === "balanced" ? 0.18 : 0.25;
  const seasonalWeight = seasonalSupport === "neutral" ? 0.05 : 0.12;
  const contrastWeight = Math.min(0.3, Math.abs(pressureScore - supportScore));
  return Number(Math.min(0.92, 0.35 + statusWeight + seasonalWeight + contrastWeight).toFixed(2));
}

function buildStrategySummary(
  status: BaziChartDto["dayMasterStatus"],
  usefulGods: FiveElement[],
  unfavorableGods: FiveElement[]
): string {
  if (status === "weak") {
    return `\u5148\u8865${formatElements(usefulGods)}\uff0c\u518d\u627f\u63a5${formatElements(unfavorableGods)}\u5e26\u6765\u7684\u538b\u529b\u548c\u8d44\u6e90\u4ea4\u6362\u3002`;
  }
  if (status === "strong") {
    return `\u7528${formatElements(usefulGods)}\u6cc4\u79c0\u6216\u7acb\u89c4\u5219\uff0c\u907f\u514d${formatElements(unfavorableGods)}\u8ba9\u65e5\u4e3b\u8fc7\u5ea6\u81a8\u80c0\u3002`;
  }
  return `\u4ee5${formatElements(usefulGods)}\u4fc3\u8fdb\u6d41\u901a\uff0c\u5c11\u8ba9${formatElements(unfavorableGods)}\u7834\u574f\u547d\u5c40\u5e73\u8861\u3002`;
}

function buildStrengthReasons(
  status: BaziChartDto["dayMasterStatus"],
  dayElementRatio: number,
  supportRatio: number,
  pressureRatio: number
): string[] {
  const reasons = [
    `\u65e5\u4e3b\u540c\u884c\u529b\u91cf\u7ea6 ${Math.round(dayElementRatio * 100)}%\uff0c\u5370\u661f\u652f\u6301\u7ea6 ${Math.round(supportRatio * 100)}%\u3002`,
    `\u6cc4\u3001\u8017\u3001\u514b\u7684\u7efc\u5408\u538b\u529b\u7ea6 ${Math.round(pressureRatio * 100)}%\u3002`
  ];
  if (status === "weak") {
    reasons.push("\u6708\u4ee4\u5bf9\u65e5\u4e3b\u4e3a\u6cc4\u8017\u6216\u514b\u5236\uff0c\u65e5\u4e3b\u9700\u8981\u5370\u6bd4\u627f\u6258\u3002");
  } else if (status === "strong") {
    reasons.push("\u65e5\u4e3b\u548c\u5370\u6bd4\u529b\u91cf\u8db3\uff0c\u9700\u8981\u98df\u4f24\u3001\u8d22\u6216\u5b98\u6740\u6765\u5bfc\u51fa\u80fd\u91cf\u3002");
  } else {
    reasons.push("\u547d\u5c40\u652f\u6301\u4e0e\u538b\u529b\u63a5\u8fd1\uff0c\u4ee5\u6d41\u901a\u548c\u7a33\u5b9a\u4e3a\u4e3b\u3002");
  }
  return reasons;
}

function formatElements(elements: FiveElement[]): string {
  return elements.map((element) => elementLabels[element]).join("\u3001");
}
