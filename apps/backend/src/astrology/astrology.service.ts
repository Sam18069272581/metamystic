import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AstrologyBody,
  AstrologyChartDto,
  AstrologyHouseDto,
  AstrologyPlacementDto,
  FiveElement
} from "@metamystic/shared";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";

const signs = [
  { name: "白羊", element: "fire", modality: "cardinal" },
  { name: "金牛", element: "earth", modality: "fixed" },
  { name: "双子", element: "air", modality: "mutable" },
  { name: "巨蟹", element: "water", modality: "cardinal" },
  { name: "狮子", element: "fire", modality: "fixed" },
  { name: "处女", element: "earth", modality: "mutable" },
  { name: "天秤", element: "air", modality: "cardinal" },
  { name: "天蝎", element: "water", modality: "fixed" },
  { name: "射手", element: "fire", modality: "mutable" },
  { name: "摩羯", element: "earth", modality: "cardinal" },
  { name: "水瓶", element: "air", modality: "fixed" },
  { name: "双鱼", element: "water", modality: "mutable" }
] as const;

const bodyLabels: Record<AstrologyBody, string> = {
  Sun: "太阳",
  Moon: "月亮",
  Ascendant: "上升"
};

type ZodiacElement = (typeof signs)[number]["element"];
type WesternElement = ZodiacElement;

const elementMap: Record<WesternElement, FiveElement> = {
  fire: "fire",
  earth: "earth",
  air: "metal",
  water: "water"
};

@Injectable()
export class AstrologyService {
  constructor(private readonly prisma: PrismaService) {}

  async createChart(profileId: string): Promise<AstrologyChartDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, birthTime: true, latitude: true, longitude: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const calculated = this.calculate(profile.id, profile.birthTime, profile.latitude, profile.longitude);
    const chart = await this.prisma.astrologyChart.create({
      data: {
        profileId: profile.id,
        placements: asPrismaJson(calculated.placements),
        houses: asPrismaJson(calculated.houses),
        dominantElements: asPrismaJson(calculated.dominantElements),
        summary: calculated.summary,
        metadata: asPrismaJson({ analysis: calculated.analysis })
      }
    });
    return {
      ...calculated,
      id: chart.id,
      createdAt: chart.createdAt.toISOString()
    };
  }

  async createUserChart(userId: string, profileId: string): Promise<AstrologyChartDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true, birthTime: true, latitude: true, longitude: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException("Profile does not belong to current user");
    }
    return this.createChart(profile.id);
  }

  private calculate(profileId: string, birthTime: Date, latitude: number | null, longitude: number | null): AstrologyChartDto {
    const seed = Math.abs(
      birthTime.getUTCFullYear() * 31 +
        (birthTime.getUTCMonth() + 1) * 37 +
        birthTime.getUTCDate() * 41 +
        birthTime.getUTCHours() * 43 +
        Math.round((latitude ?? 0) * 10) +
        Math.round((longitude ?? 0) * 10)
    );
    const sunIndex = (birthTime.getUTCMonth() + Math.floor(birthTime.getUTCDate() / 3)) % signs.length;
    const moonIndex = (sunIndex + birthTime.getUTCDate() + birthTime.getUTCHours()) % signs.length;
    const ascIndex = (seed + birthTime.getUTCHours()) % signs.length;
    const placements = [
      this.makePlacement("Sun", sunIndex, seed, 1),
      this.makePlacement("Moon", moonIndex, seed + 113, 4),
      this.makePlacement("Ascendant", ascIndex, seed + 227, 1)
    ];
    const houses = signs.map((_, index) => {
      const sign = signs[(ascIndex + index) % signs.length] ?? signs[0];
      return {
        house: index + 1,
        sign: sign.name,
        cuspDegree: (seed + index * 30) % 30
      };
    });

    return {
      id: `astrology-${profileId}-${seed}`,
      profileId,
      placements,
      houses,
      dominantElements: countElements(placements),
      analysis: buildAstrologyAnalysis(placements, countElements(placements)),
      summary: "星盘 MVP 已生成太阳、月亮、上升与十二宫，用于个人档案展示和 AI 上下文。",
      createdAt: new Date().toISOString()
    };
  }

  private makePlacement(body: AstrologyBody, signIndex: number, seed: number, fallbackHouse: number): AstrologyPlacementDto {
    const sign = signs[signIndex] ?? signs[0];
    return {
      body,
      label: bodyLabels[body],
      sign: sign.name,
      degree: seed % 30,
      house: ((signIndex + fallbackHouse - 1) % 12) + 1,
      element: elementMap[sign.element],
      modality: sign.modality
    };
  }
}

function buildAstrologyAnalysis(
  placements: AstrologyPlacementDto[],
  dominantElements: Record<FiveElement, number>
): NonNullable<AstrologyChartDto["analysis"]> {
  const sun = placements.find((placement) => placement.body === "Sun") ?? placements[0] as AstrologyPlacementDto;
  const moon = placements.find((placement) => placement.body === "Moon") ?? placements[0] as AstrologyPlacementDto;
  const ascendant = placements.find((placement) => placement.body === "Ascendant") ?? placements[0] as AstrologyPlacementDto;
  const dominantElement = Object.entries(dominantElements).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "fire";
  return {
    coreIdentity: `\u592a\u9633\u843d\u5728${sun.sign}${sun.degree}\u00b0\uff0c\u4ee3\u8868\u4e3b\u4f53\u610f\u5fd7\u3001\u81ea\u6211\u8ba4\u540c\u548c\u957f\u671f\u76ee\u6807\u7684\u8868\u8fbe\u65b9\u5f0f\u3002`,
    emotionalPattern: `\u6708\u4eae\u843d\u5728${moon.sign}${moon.degree}\u00b0\uff0c\u53cd\u6620\u60c5\u7eea\u9700\u6c42\u3001\u5b89\u5168\u611f\u548c\u79c1\u4e0b\u7684\u53cd\u5e94\u6a21\u5f0f\u3002`,
    socialMask: `\u4e0a\u5347\u843d\u5728${ascendant.sign}${ascendant.degree}\u00b0\uff0c\u662f\u4ed6\u4eba\u6700\u5148\u611f\u53d7\u5230\u7684\u6c14\u8d28\u548c\u4f60\u8fdb\u5165\u65b0\u73af\u5883\u7684\u65b9\u5f0f\u3002`,
    dominantElement: `\u76d8\u9762\u5143\u7d20\u4e2d${elementLabel(dominantElement as FiveElement)}\u8f83\u7a81\u51fa\uff0c\u5206\u6790\u65f6\u8981\u770b\u5b83\u5982\u4f55\u652f\u6491\u6216\u653e\u5927\u6027\u683c\u8868\u8fbe\u3002`,
    career: `\u4e8b\u4e1a\u4e0a\u53ef\u53c2\u8003\u592a\u9633\u548c\u4e0a\u5347\u7684\u7ec4\u5408\uff1a${sun.sign}\u63d0\u4f9b\u76ee\u6807\u611f\uff0c${ascendant.sign}\u51b3\u5b9a\u5448\u73b0\u65b9\u5f0f\u3002`,
    relationship: `\u5173\u7cfb\u4e2d\u6708\u4eae${moon.sign}\u5f88\u91cd\u8981\uff0c\u5b83\u63d0\u793a\u4f60\u771f\u6b63\u9700\u8981\u7684\u7167\u987e\u548c\u60c5\u7eea\u56de\u5e94\u3002`,
    advice: "\u661f\u76d8\u89e3\u8bfb\u5efa\u8bae\u540c\u65f6\u770b\u884c\u661f\u3001\u661f\u5ea7\u3001\u5bab\u4f4d\u3001\u76f8\u4f4d\u548c\u5143\u7d20\u6743\u91cd\uff0c\u4e0d\u5355\u770b\u592a\u9633\u661f\u5ea7\u3002"
  };
}

function elementLabel(element: FiveElement): string {
  return {
    wood: "\u6728",
    fire: "\u706b",
    earth: "\u571f",
    metal: "\u98ce",
    water: "\u6c34"
  }[element];
}

function countElements(placements: AstrologyPlacementDto[]): Record<FiveElement, number> {
  return placements.reduce<Record<FiveElement, number>>(
    (totals, placement) => {
      totals[placement.element] += 1;
      return totals;
    },
    { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 }
  );
}
