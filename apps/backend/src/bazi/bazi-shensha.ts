import type { BaziChartDto } from "@metamystic/shared";

const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const pillarOrder = ["year", "month", "day", "hour"] as const;

type PillarName = (typeof pillarOrder)[number];
type ShenshaMap = Record<PillarName, string[]>;

type StemBranchRule = {
  label: string;
  targetsByStem: Record<string, readonly string[]>;
  source: "dayStem" | "yearAndDayStem";
};

type TrineRule = {
  branches: readonly string[];
  jiangXing: string;
  yiMa: string;
  huaGai: string;
  taoHua: string;
  wangShen: string;
  jieSha: string;
  zaiSha: string;
};

const stemBranchRules: StemBranchRule[] = [
  {
    label: "天乙贵人",
    source: "yearAndDayStem",
    targetsByStem: {
      甲: ["丑", "未"],
      戊: ["丑", "未"],
      庚: ["丑", "未"],
      乙: ["子", "申"],
      己: ["子", "申"],
      丙: ["亥", "酉"],
      丁: ["亥", "酉"],
      壬: ["卯", "巳"],
      癸: ["卯", "巳"],
      辛: ["寅", "午"]
    }
  },
  {
    label: "太极贵人",
    source: "yearAndDayStem",
    targetsByStem: {
      甲: ["子", "午"],
      乙: ["子", "午"],
      丙: ["卯", "酉"],
      丁: ["卯", "酉"],
      戊: ["辰", "戌", "丑", "未"],
      己: ["辰", "戌", "丑", "未"],
      庚: ["寅", "亥"],
      辛: ["寅", "亥"],
      壬: ["巳", "申"],
      癸: ["巳", "申"]
    }
  },
  {
    label: "文昌贵人",
    source: "dayStem",
    targetsByStem: {
      甲: ["巳"],
      乙: ["午"],
      丙: ["申"],
      戊: ["申"],
      丁: ["酉"],
      己: ["酉"],
      庚: ["亥"],
      辛: ["子"],
      壬: ["寅"],
      癸: ["卯"]
    }
  },
  {
    label: "国印贵人",
    source: "yearAndDayStem",
    targetsByStem: {
      甲: ["戌"],
      乙: ["亥"],
      丙: ["丑"],
      丁: ["寅"],
      戊: ["丑"],
      己: ["寅"],
      庚: ["辰"],
      辛: ["巳"],
      壬: ["未"],
      癸: ["申"]
    }
  },
  {
    label: "金舆",
    source: "yearAndDayStem",
    targetsByStem: {
      甲: ["辰"],
      乙: ["巳"],
      丙: ["未"],
      戊: ["未"],
      丁: ["申"],
      己: ["申"],
      庚: ["戌"],
      辛: ["亥"],
      壬: ["丑"],
      癸: ["寅"]
    }
  },
  {
    label: "天厨贵人",
    source: "yearAndDayStem",
    targetsByStem: {
      甲: ["巳"],
      丙: ["巳"],
      乙: ["午"],
      丁: ["午"],
      戊: ["申"],
      己: ["酉"],
      庚: ["亥"],
      辛: ["子"],
      壬: ["寅"],
      癸: ["卯"]
    }
  },
  {
    label: "禄神",
    source: "dayStem",
    targetsByStem: {
      甲: ["寅"],
      乙: ["卯"],
      丙: ["巳"],
      戊: ["巳"],
      丁: ["午"],
      己: ["午"],
      庚: ["申"],
      辛: ["酉"],
      壬: ["亥"],
      癸: ["子"]
    }
  },
  {
    label: "羊刃",
    source: "dayStem",
    targetsByStem: {
      甲: ["卯"],
      乙: ["寅"],
      丙: ["午"],
      戊: ["午"],
      丁: ["巳"],
      己: ["巳"],
      庚: ["酉"],
      辛: ["申"],
      壬: ["子"],
      癸: ["亥"]
    }
  },
  {
    label: "流霞",
    source: "dayStem",
    targetsByStem: {
      甲: ["酉"],
      乙: ["戌"],
      丙: ["未"],
      丁: ["申"],
      戊: ["巳"],
      己: ["午"],
      庚: ["辰"],
      辛: ["卯"],
      壬: ["亥"],
      癸: ["寅"]
    }
  },
  {
    label: "红艳",
    source: "dayStem",
    targetsByStem: {
      甲: ["午"],
      乙: ["午"],
      丙: ["寅"],
      丁: ["未"],
      戊: ["辰"],
      己: ["辰"],
      庚: ["戌"],
      辛: ["酉"],
      壬: ["子"],
      癸: ["申"]
    }
  }
];

const trineRules: TrineRule[] = [
  { branches: ["寅", "午", "戌"], jiangXing: "午", yiMa: "申", huaGai: "戌", taoHua: "卯", wangShen: "巳", jieSha: "亥", zaiSha: "子" },
  { branches: ["申", "子", "辰"], jiangXing: "子", yiMa: "寅", huaGai: "辰", taoHua: "酉", wangShen: "亥", jieSha: "巳", zaiSha: "午" },
  { branches: ["巳", "酉", "丑"], jiangXing: "酉", yiMa: "亥", huaGai: "丑", taoHua: "午", wangShen: "申", jieSha: "寅", zaiSha: "卯" },
  { branches: ["亥", "卯", "未"], jiangXing: "卯", yiMa: "巳", huaGai: "未", taoHua: "子", wangShen: "寅", jieSha: "申", zaiSha: "酉" }
];

const tianDeMarkerByMonthBranch: Record<string, string> = {
  寅: "丁",
  卯: "申",
  辰: "壬",
  巳: "辛",
  午: "亥",
  未: "甲",
  申: "癸",
  酉: "寅",
  戌: "丙",
  亥: "乙",
  子: "巳",
  丑: "庚"
};

const yueDeStemByMonthBranchGroup: Array<{ branches: readonly string[]; stem: string }> = [
  { branches: ["寅", "午", "戌"], stem: "丙" },
  { branches: ["申", "子", "辰"], stem: "壬" },
  { branches: ["亥", "卯", "未"], stem: "甲" },
  { branches: ["巳", "酉", "丑"], stem: "庚" }
] as const;

const tianYiBranchByMonthBranch: Record<string, string> = {
  寅: "丑",
  卯: "寅",
  辰: "卯",
  巳: "辰",
  午: "巳",
  未: "午",
  申: "未",
  酉: "申",
  戌: "酉",
  亥: "戌",
  子: "亥",
  丑: "子"
};

const xueRenBranchByMonthBranch: Record<string, string> = {
  寅: "丑",
  卯: "未",
  辰: "寅",
  巳: "申",
  午: "卯",
  未: "酉",
  申: "辰",
  酉: "戌",
  戌: "巳",
  亥: "亥",
  子: "午",
  丑: "子"
};

const solitaryRules: Array<{ branches: readonly string[]; guChen: string; guaSu: string }> = [
  { branches: ["亥", "子", "丑"], guChen: "寅", guaSu: "戌" },
  { branches: ["寅", "卯", "辰"], guChen: "巳", guaSu: "丑" },
  { branches: ["巳", "午", "未"], guChen: "申", guaSu: "辰" },
  { branches: ["申", "酉", "戌"], guChen: "亥", guaSu: "未" }
] as const;

const hongLuanByYearBranch: Record<string, string> = {
  子: "卯",
  丑: "寅",
  寅: "丑",
  卯: "子",
  辰: "亥",
  巳: "戌",
  午: "酉",
  未: "申",
  申: "未",
  酉: "午",
  戌: "巳",
  亥: "辰"
};

const tianXiByYearBranch: Record<string, string> = {
  子: "酉",
  丑: "申",
  寅: "未",
  卯: "午",
  辰: "巳",
  巳: "辰",
  午: "卯",
  未: "寅",
  申: "丑",
  酉: "子",
  戌: "亥",
  亥: "戌"
};

const sangDiaoPiMaByYearBranch: Record<string, { sangMen: string; diaoKe: string; piMa: string }> = {
  子: { sangMen: "寅", diaoKe: "戌", piMa: "酉" },
  丑: { sangMen: "卯", diaoKe: "亥", piMa: "戌" },
  寅: { sangMen: "辰", diaoKe: "子", piMa: "亥" },
  卯: { sangMen: "巳", diaoKe: "丑", piMa: "子" },
  辰: { sangMen: "午", diaoKe: "寅", piMa: "丑" },
  巳: { sangMen: "未", diaoKe: "卯", piMa: "寅" },
  午: { sangMen: "申", diaoKe: "辰", piMa: "卯" },
  未: { sangMen: "酉", diaoKe: "巳", piMa: "辰" },
  申: { sangMen: "戌", diaoKe: "午", piMa: "巳" },
  酉: { sangMen: "亥", diaoKe: "未", piMa: "午" },
  戌: { sangMen: "子", diaoKe: "申", piMa: "未" },
  亥: { sangMen: "丑", diaoKe: "酉", piMa: "申" }
};

const dayPillarRules: Array<{ label: string; pillars: readonly string[] }> = [
  { label: "阴阳差错", pillars: ["丙子", "丙午", "丁丑", "丁未", "戊寅", "戊申", "辛卯", "辛酉", "壬辰", "壬戌", "癸巳", "癸亥"] },
  { label: "魁罡", pillars: ["戊戌", "庚辰", "庚戌", "壬辰"] },
  { label: "十恶大败", pillars: ["甲辰", "乙巳", "丙申", "丁亥", "戊戌", "己丑", "庚辰", "辛巳", "壬申", "癸亥"] },
  { label: "孤鸾煞", pillars: ["乙巳", "丁巳", "辛亥", "戊申", "壬寅", "戊午", "壬子", "丙午"] },
  { label: "十灵日", pillars: ["甲辰", "乙亥", "丙辰", "丁酉", "戊午", "庚戌", "庚寅", "辛亥", "壬寅", "癸未"] },
  { label: "六秀日", pillars: ["丙午", "丁未", "戊子", "戊午", "己丑", "己未"] }
];

export function calculateBaziShensha(pillars: BaziChartDto["pillars"], dayMaster: string): ShenshaMap {
  const result = createEmptyResult();
  applyStemBranchRules(result, pillars, dayMaster);
  applyMonthBranchRules(result, pillars);
  applyTrineRules(result, pillars);
  applyYearBranchRules(result, pillars);
  applyDayPillarRules(result, pillars);
  applyKongWang(result, pillars);
  return result;
}

function createEmptyResult(): ShenshaMap {
  return { year: [], month: [], day: [], hour: [] };
}

function applyStemBranchRules(result: ShenshaMap, pillars: BaziChartDto["pillars"], dayMaster: string): void {
  for (const rule of stemBranchRules) {
    const sourceStems = rule.source === "yearAndDayStem" ? [pillars.year.stem, dayMaster] : [dayMaster];
    const targets = new Set(sourceStems.flatMap((stem) => rule.targetsByStem[stem] ?? []));
    for (const name of pillarOrder) {
      if (targets.has(pillars[name].branch)) {
        add(result, name, rule.label);
      }
    }
  }
}

function applyMonthBranchRules(result: ShenshaMap, pillars: BaziChartDto["pillars"]): void {
  const tianDeMarker = tianDeMarkerByMonthBranch[pillars.month.branch];
  const yueDeStem = yueDeStemByMonthBranchGroup.find((rule) => rule.branches.includes(pillars.month.branch))?.stem;
  const tianYiBranch = tianYiBranchByMonthBranch[pillars.month.branch];
  const xueRenBranch = xueRenBranchByMonthBranch[pillars.month.branch];

  for (const name of pillarOrder) {
    const pillar = pillars[name];
    if (tianDeMarker && (pillar.stem === tianDeMarker || pillar.branch === tianDeMarker)) {
      add(result, name, "天德贵人");
    }
    if (yueDeStem && pillar.stem === yueDeStem) {
      add(result, name, "月德贵人");
    }
    if (tianYiBranch && pillar.branch === tianYiBranch) {
      add(result, name, "天医");
    }
    if (xueRenBranch && pillar.branch === xueRenBranch) {
      add(result, name, "血刃");
    }
  }
}

function applyTrineRules(result: ShenshaMap, pillars: BaziChartDto["pillars"]): void {
  const yearRule = findTrineRule(pillars.year.branch);
  const dayRule = findTrineRule(pillars.day.branch);

  for (const rule of uniqueRules([yearRule, dayRule])) {
    for (const name of pillarOrder) {
      const branch = pillars[name].branch;
      if (branch === rule.jiangXing) add(result, name, "将星");
      if (branch === rule.yiMa) add(result, name, "驿马");
      if (branch === rule.huaGai) add(result, name, "华盖");
      if (branch === rule.taoHua) add(result, name, "桃花");
      if (branch === rule.wangShen) add(result, name, "亡神");
      if (branch === rule.jieSha) add(result, name, "劫煞");
    }
  }

  if (yearRule) {
    for (const name of pillarOrder) {
      if (pillars[name].branch === yearRule.zaiSha) {
        add(result, name, "灾煞");
      }
    }
  }
}

function applyYearBranchRules(result: ShenshaMap, pillars: BaziChartDto["pillars"]): void {
  const solitaryRule = solitaryRules.find((rule) => rule.branches.includes(pillars.year.branch));
  const hongLuan = hongLuanByYearBranch[pillars.year.branch];
  const tianXi = tianXiByYearBranch[pillars.year.branch];
  const mourning = sangDiaoPiMaByYearBranch[pillars.year.branch];

  for (const name of pillarOrder) {
    const branch = pillars[name].branch;
    if (solitaryRule?.guChen === branch) add(result, name, "孤辰");
    if (solitaryRule?.guaSu === branch) add(result, name, "寡宿");
    if (hongLuan === branch) add(result, name, "红鸾");
    if (tianXi === branch) add(result, name, "天喜");
    if (mourning?.sangMen === branch) add(result, name, "丧门");
    if (mourning?.diaoKe === branch) add(result, name, "吊客");
    if (mourning?.piMa === branch) add(result, name, "披麻");
  }
}

function applyDayPillarRules(result: ShenshaMap, pillars: BaziChartDto["pillars"]): void {
  const dayPillar = `${pillars.day.stem}${pillars.day.branch}`;
  for (const rule of dayPillarRules) {
    if (rule.pillars.includes(dayPillar)) {
      add(result, "day", rule.label);
    }
  }
}

function applyKongWang(result: ShenshaMap, pillars: BaziChartDto["pillars"]): void {
  const emptyBranches = getKongWangBranches(pillars.day.stem, pillars.day.branch);
  if (emptyBranches.length === 0) {
    return;
  }
  for (const name of ["year", "month", "hour"] as const) {
    if (emptyBranches.includes(pillars[name].branch)) {
      add(result, name, "空亡");
    }
  }
}

function findTrineRule(branch: string): TrineRule | undefined {
  return trineRules.find((rule) => rule.branches.includes(branch));
}

function uniqueRules(rules: Array<TrineRule | undefined>): TrineRule[] {
  return Array.from(new Set(rules.filter((rule): rule is TrineRule => Boolean(rule))));
}

function getKongWangBranches(stem: string, branch: string): string[] {
  const stemIndex = stems.indexOf(stem as (typeof stems)[number]);
  const branchIndex = branches.indexOf(branch as (typeof branches)[number]);
  if (stemIndex < 0 || branchIndex < 0) {
    return [];
  }
  const jiaZiIndex = Array.from({ length: 60 }, (_, index) => index).find(
    (index) => index % stems.length === stemIndex && index % branches.length === branchIndex
  );
  if (jiaZiIndex === undefined) {
    return [];
  }
  const xunStartBranchIndex = Math.floor(jiaZiIndex / 10) * 10;
  return [branches[(xunStartBranchIndex + 10) % branches.length]!, branches[(xunStartBranchIndex + 11) % branches.length]!];
}

function add(result: ShenshaMap, name: PillarName, label: string): void {
  if (!result[name].includes(label)) {
    result[name].push(label);
  }
}
