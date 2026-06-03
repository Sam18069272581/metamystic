import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  AstrologyChartDto,
  BaziChartDto,
  FiveElement,
  ProfileDto,
  UserChartArchiveDto,
  UserChartDetailDto,
  UserChartKind,
  ZiweiChartDto
} from "@metamystic/shared";
import { PrismaService } from "../prisma/prisma.service";
import { enrichProfessionalBaziChart } from "../bazi/professional-bazi";

const chartLimit = 20;

@Injectable()
export class UserChartService {
  constructor(private readonly prisma: PrismaService) {}

  async listMyCharts(userId: string): Promise<UserChartArchiveDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { userId }
    });
    if (!profile) {
      return {
        profile: undefined,
        baziCharts: [],
        ziweiCharts: [],
        astrologyCharts: []
      };
    }

    const [baziCharts, ziweiCharts, astrologyCharts] = await Promise.all([
      this.prisma.baziChart.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: chartLimit
      }),
      this.prisma.ziweiChart.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: chartLimit
      }),
      this.prisma.astrologyChart.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: chartLimit
      })
    ]);

    return {
      profile: toProfileDto(profile),
      baziCharts: baziCharts.map(toBaziChartDto),
      ziweiCharts: ziweiCharts.map(toZiweiChartDto),
      astrologyCharts: astrologyCharts.map(toAstrologyChartDto)
    };
  }

  async getMyChart(userId: string, kind: UserChartKind, chartId: string): Promise<UserChartDetailDto> {
    if (kind === "bazi") {
      const chart = await this.prisma.baziChart.findFirst({
        where: {
          id: chartId,
          profile: { userId }
        }
      });
      if (!chart) {
        throw new NotFoundException("Chart not found");
      }
      return { kind, chart: toBaziChartDto(chart) };
    }

    if (kind === "ziwei") {
      const chart = await this.prisma.ziweiChart.findFirst({
        where: {
          id: chartId,
          profile: { userId }
        }
      });
      if (!chart) {
        throw new NotFoundException("Chart not found");
      }
      return { kind, chart: toZiweiChartDto(chart) };
    }

    if (kind === "astrology") {
      const chart = await this.prisma.astrologyChart.findFirst({
        where: {
          id: chartId,
          profile: { userId }
        }
      });
      if (!chart) {
        throw new NotFoundException("Chart not found");
      }
      return { kind, chart: toAstrologyChartDto(chart) };
    }

    throw new NotFoundException("Chart not found");
  }
}

function toProfileDto(profile: {
  id: string;
  displayName: string | null;
  birthTime: Date;
  birthTimezone: string;
  gender: ProfileDto["gender"];
  birthPlace: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: Date;
  updatedAt: Date;
}): ProfileDto {
  return {
    id: profile.id,
    anonymousUserId: "",
    displayName: profile.displayName ?? undefined,
    birthTime: profile.birthTime.toISOString(),
    birthTimezone: profile.birthTimezone,
    gender: profile.gender,
    birthPlace: profile.birthPlace ?? undefined,
    latitude: profile.latitude ?? undefined,
    longitude: profile.longitude ?? undefined,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}

function toBaziChartDto(chart: {
  id: string;
  profileId: string;
  dayMaster: string;
  dayMasterStatus: string;
  mainPattern: string;
  pillars: unknown;
  elements: unknown;
  metadata: unknown;
  createdAt: Date;
}): BaziChartDto {
  const metadata = chart.metadata && typeof chart.metadata === "object" ? (chart.metadata as Record<string, unknown>) : {};
  const dto = {
    id: chart.id,
    profileId: chart.profileId,
    dayMaster: chart.dayMaster,
    dayMasterStatus: chart.dayMasterStatus as BaziChartDto["dayMasterStatus"],
    mainPattern: chart.mainPattern,
    pillars: chart.pillars as BaziChartDto["pillars"],
    elements: chart.elements as Record<FiveElement, number>,
    usefulGods: Array.isArray(metadata.usefulGods) ? (metadata.usefulGods as FiveElement[]) : undefined,
    unfavorableGods: Array.isArray(metadata.unfavorableGods) ? (metadata.unfavorableGods as FiveElement[]) : undefined,
    analysis: readAnalysis<BaziChartDto["analysis"]>(chart, "analysis"),
    metadata,
    createdAt: chart.createdAt.toISOString()
  };
  if (dto.analysis) {
    return dto;
  }
  const enriched = enrichProfessionalBaziChart(dto);
  return {
    ...enriched,
    usefulGods: dto.usefulGods ?? enriched.usefulGods,
    unfavorableGods: dto.unfavorableGods ?? enriched.unfavorableGods
  };
}

function toZiweiChartDto(chart: {
  id: string;
  profileId: string;
  lifePalace: string;
  bodyPalace: string;
  palaces: unknown;
  metadata?: unknown;
  summary: string;
  createdAt: Date;
}): ZiweiChartDto {
  return {
    id: chart.id,
    profileId: chart.profileId,
    lifePalace: chart.lifePalace as ZiweiChartDto["lifePalace"],
    bodyPalace: chart.bodyPalace as ZiweiChartDto["bodyPalace"],
    palaces: chart.palaces as ZiweiChartDto["palaces"],
    analysis: readAnalysis<ZiweiChartDto["analysis"]>(chart, buildStoredAnalysisKey("analysis")),
    summary: chart.summary,
    createdAt: chart.createdAt.toISOString()
  };
}

function toAstrologyChartDto(chart: {
  id: string;
  profileId: string;
  placements: unknown;
  houses: unknown;
  dominantElements: unknown;
  metadata?: unknown;
  summary: string;
  createdAt: Date;
}): AstrologyChartDto {
  return {
    id: chart.id,
    profileId: chart.profileId,
    placements: chart.placements as AstrologyChartDto["placements"],
    houses: chart.houses as AstrologyChartDto["houses"],
    dominantElements: chart.dominantElements as Record<FiveElement, number>,
    analysis: readAnalysis<AstrologyChartDto["analysis"]>(chart, buildStoredAnalysisKey("analysis")),
    summary: chart.summary,
    createdAt: chart.createdAt.toISOString()
  };
}

function readAnalysis<T>(chart: { metadata?: unknown }, key: string): T | undefined {
  const metadata = chart.metadata && typeof chart.metadata === "object" ? (chart.metadata as Record<string, unknown>) : {};
  const value = metadata[key];
  return value && typeof value === "object" ? (value as T) : undefined;
}

function buildStoredAnalysisKey(key: "analysis"): string {
  return key;
}
