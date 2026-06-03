import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ZiweiChartDto, ZiweiPalaceDto, ZiweiPalaceName } from "@metamystic/shared";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";

const palaceNames: ZiweiPalaceName[] = [
  "life",
  "siblings",
  "spouse",
  "children",
  "wealth",
  "health",
  "travel",
  "friends",
  "career",
  "property",
  "fortune",
  "parents"
];

const palaceLabels: Record<ZiweiPalaceName, string> = {
  life: "\u547d\u5bab",
  siblings: "\u5144\u5f1f",
  spouse: "\u592b\u59bb",
  children: "\u5b50\u5973",
  wealth: "\u8d22\u5e1b",
  health: "\u75be\u5384",
  travel: "\u8fc1\u79fb",
  friends: "\u4ea4\u53cb",
  career: "\u5b98\u7984",
  property: "\u7530\u5b85",
  fortune: "\u798f\u5fb7",
  parents: "\u7236\u6bcd"
};

const branches = ["\u5b50", "\u4e11", "\u5bc5", "\u536f", "\u8fb0", "\u5df3", "\u5348", "\u672a", "\u7533", "\u9149", "\u620c", "\u4ea5"];
const majorStars = ["\u7d2b\u5fae", "\u5929\u673a", "\u592a\u9633", "\u6b66\u66f2", "\u5929\u540c", "\u5ec9\u8d1e", "\u5929\u5e9c", "\u592a\u9634", "\u8d2a\u72fc", "\u5de8\u95e8", "\u5929\u76f8", "\u5929\u6881", "\u4e03\u6740", "\u7834\u519b"];
const minorStars = ["\u6587\u660c", "\u6587\u66f2", "\u5de6\u8f85", "\u53f3\u5f3c", "\u5929\u9b41", "\u5929\u94ba", "\u7984\u5b58", "\u5929\u9a6c"];

@Injectable()
export class ZiweiService {
  constructor(private readonly prisma: PrismaService) {}

  async createChart(profileId: string): Promise<ZiweiChartDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, birthTime: true, gender: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const calculated = this.calculate(profile.id, profile.birthTime);
    const chart = await this.prisma.ziweiChart.create({
      data: {
        profileId: profile.id,
        lifePalace: calculated.lifePalace,
        bodyPalace: calculated.bodyPalace,
        palaces: asPrismaJson(calculated.palaces),
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

  async createUserChart(userId: string, profileId: string): Promise<ZiweiChartDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true, userId: true, birthTime: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException("Profile does not belong to current user");
    }
    return this.createChart(profile.id);
  }

  private calculate(profileId: string, birthTime: Date): ZiweiChartDto {
    const seed = Math.abs(
      birthTime.getUTCFullYear() * 13 +
        (birthTime.getUTCMonth() + 1) * 17 +
        birthTime.getUTCDate() * 19 +
        birthTime.getUTCHours() * 23
    );
    const lifeIndex = seed % 12;
    const bodyIndex = (lifeIndex + birthTime.getUTCHours()) % 12;
    const palaces: ZiweiPalaceDto[] = palaceNames.map((name, index) => ({
      name,
      label: palaceLabels[name],
      earthlyBranch: branches[(lifeIndex + index) % branches.length] ?? "\u5b50",
      majorStars: [
        majorStars[(seed + index) % majorStars.length] ?? "\u7d2b\u5fae",
        majorStars[(seed + index + 6) % majorStars.length] ?? "\u5929\u5e9c"
      ],
      minorStars: [
        minorStars[(seed + index) % minorStars.length] ?? "\u6587\u660c",
        minorStars[(seed + index + 3) % minorStars.length] ?? "\u53f3\u5f3c"
      ],
      ageRange: `${index * 10 + 2}-${index * 10 + 11}`
    }));

    return {
      id: `ziwei-${profileId}-${seed}`,
      profileId,
      lifePalace: palaceNames[lifeIndex] ?? "life",
      bodyPalace: palaceNames[bodyIndex] ?? "life",
      palaces,
      analysis: buildZiweiAnalysis(palaces, palaceNames[lifeIndex] ?? "life", palaceNames[bodyIndex] ?? "life"),
      summary: "\u7d2b\u5fae MVP \u76d8\u9762\u5df2\u751f\u6210\uff0c\u5f53\u524d\u7528\u4e8e UI \u548c AI \u4e0a\u4e0b\u6587\uff0c\u540e\u7eed\u63a5\u5165\u6b63\u5f0f\u6392\u76d8\u6cd5\u3002",
      createdAt: new Date().toISOString()
    };
  }
}

function buildZiweiAnalysis(
  palaces: ZiweiPalaceDto[],
  lifePalace: ZiweiPalaceName,
  bodyPalace: ZiweiPalaceName
): NonNullable<ZiweiChartDto["analysis"]> {
  const life = findPalace(palaces, lifePalace);
  const body = findPalace(palaces, bodyPalace);
  const career = findPalace(palaces, "career");
  const wealth = findPalace(palaces, "wealth");
  const spouse = findPalace(palaces, "spouse");
  return {
    lifeTheme: `\u547d\u5bab\u5728${life.label}\uff0c\u4e3b\u661f${life.majorStars.join("\u3001")}\uff0c\u4ee3\u8868\u4eba\u683c\u6838\u5fc3\u548c\u4eba\u751f\u8d77\u624b\u5f0f\u3002`,
    bodyTheme: `\u8eab\u5bab\u5728${body.label}\uff0c\u884c\u52a8\u4e0a\u66f4\u5bb9\u6613\u843d\u5230${body.label}\u8bae\u9898\uff0c\u9700\u5c06\u7406\u60f3\u8f6c\u4e3a\u53ef\u6267\u884c\u8282\u594f\u3002`,
    career: `\u5b98\u7984\u5bab\u89c1${career.majorStars.join("\u3001")}\uff0c\u9002\u5408\u4ee5\u4e3b\u661f\u7279\u8d28\u5efa\u7acb\u804c\u4e1a\u5b9a\u4f4d\u3002`,
    wealth: `\u8d22\u5e1b\u5bab\u89c1${wealth.majorStars.join("\u3001")}\uff0c\u8d22\u52a1\u7b56\u7565\u8981\u540c\u65f6\u770b\u6536\u5165\u6e20\u9053\u548c\u98ce\u9669\u63a7\u5236\u3002`,
    relationship: `\u592b\u59bb\u5bab\u89c1${spouse.majorStars.join("\u3001")}\uff0c\u5173\u7cfb\u4e2d\u91cd\u70b9\u662f\u5bf9\u65b9\u7684\u8282\u594f\u4e0e\u534f\u4f5c\u65b9\u5f0f\u3002`,
    advice: "\u7d2b\u5fae\u89e3\u8bfb\u5efa\u8bae\u7ed3\u5408\u4e09\u65b9\u56db\u6b63\u3001\u5927\u9650\u6d41\u5e74\u4e0e\u4e3b\u8f85\u6742\u66dc\u540c\u770b\uff0c\u4e0d\u5355\u770b\u4e00\u5bab\u4e00\u661f\u3002"
  };
}

function findPalace(palaces: ZiweiPalaceDto[], name: ZiweiPalaceName): ZiweiPalaceDto {
  return palaces.find((palace) => palace.name === name) ?? palaces[0] as ZiweiPalaceDto;
}
