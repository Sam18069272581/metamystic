import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { BaziChartDto, FiveElement, PublicBaziShareDto } from "@metamystic/shared";
import { createHash } from "crypto";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";
import type { BaziEngine } from "./bazi-engine";
import { enrichProfessionalBaziChart } from "./professional-bazi";

@Injectable()
export class BaziService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject("BAZI_ENGINE") private readonly engine: BaziEngine
  ) {}

  async createChart(profileId: string): Promise<BaziChartDto> {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const fingerprint = createBaziChartFingerprint(profile);
    const existingChart = await this.prisma.baziChart.findUnique({
      where: {
        profileId_fingerprint: {
          profileId,
          fingerprint
        }
      }
    });
    if (existingChart) {
      return toBaziChartDto(existingChart);
    }

    const calculated = enrichProfessionalBaziChart(this.engine.calculate({
      profileId,
      birthTime: profile.birthTime,
      birthTimezone: profile.birthTimezone,
      gender: profile.gender
    }));

    try {
      const chart = await this.prisma.baziChart.create({
        data: {
          profileId,
          fingerprint,
          dayMaster: calculated.dayMaster,
          dayMasterStatus: calculated.dayMasterStatus,
          mainPattern: calculated.mainPattern,
          pillars: asPrismaJson(calculated.pillars),
          elements: asPrismaJson(calculated.elements),
          metadata: asPrismaJson(calculated.metadata)
        }
      });

      return toBaziChartDto(chart);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const chart = await this.prisma.baziChart.findUnique({
          where: {
            profileId_fingerprint: {
              profileId,
              fingerprint
            }
          }
        });
        if (chart) {
          return toBaziChartDto(chart);
        }
      }
      throw error;
    }
  }

  async createUserChart(userId: string, profileId: string): Promise<BaziChartDto> {
    const profile = await this.prisma.profile.findUnique({ where: { id: profileId }, select: { userId: true } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException("Profile does not belong to current user");
    }
    return this.createChart(profileId);
  }

  async getPublicShareChart(chartId: string): Promise<PublicBaziShareDto> {
    const chart = await this.prisma.baziChart.findUnique({ where: { id: chartId } });
    if (!chart) {
      throw new NotFoundException("Chart not found");
    }
    const { profileId: _profileId, ...shareChart } = toBaziChartDto(chart);
    return shareChart;
  }
}

function createBaziChartFingerprint(profile: {
  birthTime: Date;
  birthTimezone: string;
  gender: string;
}): string {
  return createHash("sha256")
    .update(JSON.stringify({
      birthTime: profile.birthTime.toISOString(),
      birthTimezone: profile.birthTimezone,
      gender: profile.gender
    }))
    .digest("hex");
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
  const dto: BaziChartDto = {
    id: chart.id,
    profileId: chart.profileId,
    dayMaster: chart.dayMaster,
    dayMasterStatus: chart.dayMasterStatus as BaziChartDto["dayMasterStatus"],
    mainPattern: chart.mainPattern,
    pillars: chart.pillars as BaziChartDto["pillars"],
    elements: chart.elements as Record<FiveElement, number>,
    usefulGods: Array.isArray(metadata.usefulGods) ? (metadata.usefulGods as FiveElement[]) : undefined,
    unfavorableGods: Array.isArray(metadata.unfavorableGods) ? (metadata.unfavorableGods as FiveElement[]) : undefined,
    analysis: readMetadataObject<BaziChartDto["analysis"]>(metadata, "analysis"),
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

function readMetadataObject<T>(metadata: Record<string, unknown>, key: string): T | undefined {
  const value = metadata[key];
  return value && typeof value === "object" ? (value as T) : undefined;
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
