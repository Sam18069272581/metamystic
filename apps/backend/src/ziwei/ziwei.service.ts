import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { ZiweiChartDto, ZiweiPalaceDto, ZiweiPalaceName } from "@metamystic/shared";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";
import { createHash } from "node:crypto";
import { getZonedParts } from "../profile/birth-input";
import { IztroZiweiEngine } from "./iztro-ziwei-engine";

@Injectable()
export class ZiweiService {
  private readonly engine = new IztroZiweiEngine();

  constructor(private readonly prisma: PrismaService) {}

  async createChart(profileId: string): Promise<ZiweiChartDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: {
        id: true, birthTime: true, birthTimezone: true, birthLocalDate: true, birthLocalTime: true,
        gender: true, lateZiHourRule: true, birthDataVersion: true
      }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const local = profile.birthLocalDate && profile.birthLocalTime
      ? { date: profile.birthLocalDate, time: profile.birthLocalTime }
      : toLocalDateTime(profile.birthTime, profile.birthTimezone);
    const fingerprint = createHash("sha256").update(JSON.stringify({
      local, gender: profile.gender, lateZiHourRule: profile.lateZiHourRule, birthDataVersion: profile.birthDataVersion,
      engine: "iztro", engineVersion: "2.5.8"
    })).digest("hex");
    const existing = await this.prisma.ziweiChart.findUnique({
      where: { profileId_fingerprint: { profileId, fingerprint } }
    });
    if (existing) {
      return toStoredZiweiChart(existing);
    }
    const engineResult = this.engine.calculate({
      profileId: profile.id,
      localDate: local.date,
      localTime: local.time,
      gender: profile.gender,
      lateZiHourRule: profile.lateZiHourRule === "nextDay" ? "nextDay" : "sameDay"
    });
    const calculated = {
      ...engineResult,
      analysis: buildZiweiAnalysis(engineResult.palaces, engineResult.lifePalace, engineResult.bodyPalace)
    };
    const chart = await this.prisma.ziweiChart.create({
      data: {
        profileId: profile.id,
        fingerprint,
        engine: "iztro",
        engineVersion: "2.5.8",
        inputSnapshot: asPrismaJson({ localDate: local.date, localTime: local.time, gender: profile.gender }),
        lifePalace: calculated.lifePalace,
        bodyPalace: calculated.bodyPalace,
        palaces: asPrismaJson(calculated.palaces),
        summary: calculated.summary,
        metadata: asPrismaJson({ ...calculated.metadata, analysis: calculated.analysis })
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

}

function toLocalDateTime(date: Date, timezone: string): { date: string; time: string } {
  const p = getZonedParts(date, timezone);
  return {
    date: `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`,
    time: `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`
  };
}

function toStoredZiweiChart(chart: { id: string; profileId: string; lifePalace: string; bodyPalace: string; palaces: unknown; summary: string; metadata: unknown; createdAt: Date }): ZiweiChartDto {
  const metadata = chart.metadata && typeof chart.metadata === "object" ? chart.metadata as Record<string, unknown> : {};
  return {
    id: chart.id, profileId: chart.profileId,
    lifePalace: chart.lifePalace as ZiweiPalaceName, bodyPalace: chart.bodyPalace as ZiweiPalaceName,
    palaces: chart.palaces as ZiweiPalaceDto[], summary: chart.summary,
    analysis: metadata.analysis as ZiweiChartDto["analysis"], createdAt: chart.createdAt.toISOString()
  };
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
