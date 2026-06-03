import type { BaziChartDto, BaziPillarDto, FiveElement } from "@metamystic/shared";
import { SolarTime } from "tyme4ts";

export interface BaziEngineInput {
  profileId: string;
  birthTime: Date;
  birthTimezone: string;
  gender: string;
}

export interface CalculatedBaziChart extends Omit<BaziChartDto, "id" | "createdAt"> {
  metadata: Record<string, unknown>;
}

export interface BaziEngine {
  calculate(input: BaziEngineInput): CalculatedBaziChart;
}

const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const branches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const tenGods = ["比肩", "劫财", "食神", "伤官", "正财", "偏财", "正官", "七杀", "正印", "偏印"] as const;
const nayin = ["海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木"] as const;
const elements = ["wood", "fire", "earth", "metal", "water"] as const satisfies readonly FiveElement[];

const stemElements: Record<(typeof stems)[number], FiveElement> = {
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

const generatingElement: Record<FiveElement, FiveElement> = {
  wood: "water",
  fire: "wood",
  earth: "fire",
  metal: "earth",
  water: "metal"
};

const patternByStatusAndElement: Record<
  BaziChartDto["dayMasterStatus"],
  Record<FiveElement, string>
> = {
  weak: {
    wood: "杀印相生",
    fire: "印比扶身",
    earth: "财官压身",
    metal: "官杀压身",
    water: "印星护身"
  },
  balanced: {
    wood: "食神生财",
    fire: "官印相生",
    earth: "财星成势",
    metal: "杀印相生",
    water: "伤官配印"
  },
  strong: {
    wood: "食伤泄秀",
    fire: "财星为用",
    earth: "官星制身",
    metal: "食神制杀",
    water: "财官双美"
  }
};

export class MvpBaziEngine implements BaziEngine {
  calculate(input: BaziEngineInput): CalculatedBaziChart {
    const seed = this.seedFromDate(input.birthTime);
    const pillar = (offset: number): BaziPillarDto => ({
      stem: stems[(seed + offset) % stems.length] ?? "乙",
      branch: branches[(seed + offset * 2) % branches.length] ?? "卯",
      tenGod: tenGods[(seed + offset * 3) % tenGods.length] ?? "正印",
      hiddenStems: [
        stems[(seed + offset + 1) % stems.length] ?? "乙",
        stems[(seed + offset + 4) % stems.length] ?? "辛"
      ],
      nayin: nayin[(seed + offset) % nayin.length] ?? "大林木"
    });

    const raw = elements.map((_, index) => 18 + (this.mix(seed, index + 1) % 40));
    const total = raw.reduce((sum, value) => sum + value, 0);
    const distribution = elements.reduce<Record<FiveElement, number>>(
      (acc, element, index) => {
        acc[element] = Number(((raw[index] ?? 0) / total).toFixed(2));
        return acc;
      },
      { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
    );

    const dayMaster = stems[(seed + 6) % stems.length] ?? "乙";
    const dayElement = stemElements[dayMaster];
    const supportiveElement = generatingElement[dayElement];
    const supportScore = (distribution[dayElement] ?? 0) + (distribution[supportiveElement] ?? 0);
    const status: BaziChartDto["dayMasterStatus"] =
      supportScore >= 0.47 ? "strong" : supportScore <= 0.35 ? "weak" : "balanced";
    const dominantElement = this.getDominantElement(distribution);

    return {
      profileId: input.profileId,
      dayMaster,
      dayMasterStatus: status,
      mainPattern: patternByStatusAndElement[status][dominantElement],
      pillars: {
        year: pillar(1),
        month: pillar(2),
        day: pillar(3),
        hour: pillar(4)
      },
      elements: distribution,
      metadata: {
        engine: "mvp-deterministic",
        warning: "MVP calculation for product development; replace with certified rules engine before paid launch.",
        birthTimezone: input.birthTimezone,
        gender: input.gender,
        dayElement,
        supportiveElement,
        supportScore,
        dominantElement
      }
    };
  }

  private seedFromDate(date: Date): number {
    return Math.abs(
      date.getUTCFullYear() * 13 +
        (date.getUTCMonth() + 1) * 17 +
        date.getUTCDate() * 19 +
        date.getUTCHours() * 23 +
        date.getUTCMinutes()
    );
  }

  private mix(seed: number, salt: number): number {
    let value = seed + salt * 0x9e3779b1;
    value ^= value >>> 16;
    value = Math.imul(value, 0x85ebca6b);
    value ^= value >>> 13;
    value = Math.imul(value, 0xc2b2ae35);
    value ^= value >>> 16;
    return Math.abs(value);
  }

  private getDominantElement(distribution: Record<FiveElement, number>): FiveElement {
    return elements.reduce<FiveElement>((dominant, element) =>
      distribution[element] > distribution[dominant] ? element : dominant
    , "wood");
  }
}

interface TymePillarLike {
  getHeavenStem(): { getName(): string; getElement(): { getName(): string }; getTenStar(stem: unknown): { getName(): string } };
  getEarthBranch(): {
    getName(): string;
    getElement(): { getName(): string };
    getHideHeavenStems(): Array<{ getName(): string }>;
  };
  getSound(): { getName(): string };
}

export class TymeBaziEngine implements BaziEngine {
  calculate(input: BaziEngineInput): CalculatedBaziChart {
    const local = this.getDateParts(input.birthTime);
    const solarTime = SolarTime.fromYmdHms(
      local.year,
      local.month,
      local.day,
      local.hour,
      local.minute,
      local.second
    );
    const eightChar = solarTime.getLunarHour().getEightChar();
    const dayStem = eightChar.getDay().getHeavenStem();
    const pillars = {
      year: this.toPillar(eightChar.getYear() as TymePillarLike, dayStem),
      month: this.toPillar(eightChar.getMonth() as TymePillarLike, dayStem),
      day: this.toPillar(eightChar.getDay() as TymePillarLike, dayStem),
      hour: this.toPillar(eightChar.getHour() as TymePillarLike, dayStem)
    };
    const elements = this.calculateElements([
      eightChar.getYear() as TymePillarLike,
      eightChar.getMonth() as TymePillarLike,
      eightChar.getDay() as TymePillarLike,
      eightChar.getHour() as TymePillarLike
    ]);
    const dayMaster = dayStem.getName();
    const dayElement = this.toFiveElement(dayStem.getElement().getName());
    const supportiveElement = generatingElement[dayElement];
    const supportScore = (elements[dayElement] ?? 0) + (elements[supportiveElement] ?? 0);
    const dayMasterStatus: BaziChartDto["dayMasterStatus"] =
      supportScore >= 0.47 ? "strong" : supportScore <= 0.35 ? "weak" : "balanced";
    const dominantElement = this.getDominantElement(elements);

    return {
      profileId: input.profileId,
      dayMaster,
      dayMasterStatus,
      mainPattern: patternByStatusAndElement[dayMasterStatus][dominantElement],
      pillars,
      elements,
      metadata: {
        engine: "tyme4ts",
        source: "6tail/tyme4ts",
        license: "MIT",
        birthTimezone: input.birthTimezone,
        gender: input.gender,
        dayElement,
        supportiveElement,
        supportScore,
        dominantElement,
        fetalOrigin: eightChar.getFetalOrigin().getName(),
        fetalBreath: eightChar.getFetalBreath().getName(),
        ownSign: eightChar.getOwnSign().getName(),
        bodySign: eightChar.getBodySign().getName()
      }
    };
  }

  private getDateParts(date: Date): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
  } {
    return {
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      hour: date.getUTCHours(),
      minute: date.getUTCMinutes(),
      second: date.getUTCSeconds()
    };
  }

  private toPillar(pillar: TymePillarLike, dayStem: unknown): BaziPillarDto {
    const stem = pillar.getHeavenStem();
    const branch = pillar.getEarthBranch();
    return {
      stem: stem.getName(),
      branch: branch.getName(),
      tenGod: stem.getTenStar(dayStem).getName(),
      hiddenStems: branch.getHideHeavenStems().map((hiddenStem) => hiddenStem.getName()),
      nayin: pillar.getSound().getName()
    };
  }

  private calculateElements(pillars: TymePillarLike[]): Record<FiveElement, number> {
    const weights: Record<FiveElement, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    for (const pillar of pillars) {
      weights[this.toFiveElement(pillar.getHeavenStem().getElement().getName())] += 1;
      weights[this.toFiveElement(pillar.getEarthBranch().getElement().getName())] += 0.85;
      for (const hiddenStem of pillar.getEarthBranch().getHideHeavenStems()) {
        weights[this.toFiveElement(stemElements[hiddenStem.getName() as keyof typeof stemElements] ? stemElements[hiddenStem.getName() as keyof typeof stemElements] : "earth")] += 0.35;
      }
    }

    const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
    return elements.reduce<Record<FiveElement, number>>(
      (acc, element) => {
        acc[element] = Number((weights[element] / total).toFixed(2));
        return acc;
      },
      { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
    );
  }

  private toFiveElement(name: string): FiveElement {
    const map: Record<string, FiveElement> = {
      木: "wood",
      火: "fire",
      土: "earth",
      金: "metal",
      水: "water",
      wood: "wood",
      fire: "fire",
      earth: "earth",
      metal: "metal",
      water: "water"
    };
    return map[name] ?? "earth";
  }

  private getDominantElement(distribution: Record<FiveElement, number>): FiveElement {
    return elements.reduce<FiveElement>(
      (dominant, element) => (distribution[element] > distribution[dominant] ? element : dominant),
      "wood"
    );
  }
}
