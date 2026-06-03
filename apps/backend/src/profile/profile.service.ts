import { Injectable } from "@nestjs/common";
import type {
  ConsultationTone,
  ProfileDto,
  ProfileMemorySignalsDto,
  UpsertProfileRequest,
  UpsertUserProfileRequest
} from "@metamystic/shared";
import type { PrismaJsonObject } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";
import { extractProfileMemorySignals, mergeProfileMemorySignals, type ProfileMemorySignals } from "./profile-memory";

export interface RememberCompletedConsultationInput {
  profileId: string;
  consultationId: string;
  question: string;
  answer: string;
  tone: ConsultationTone;
}

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertProfile(input: UpsertProfileRequest): Promise<ProfileDto> {
    const user = await this.prisma.user.upsert({
      where: { anonymousUserId: input.anonymousUserId },
      update: {},
      create: { anonymousUserId: input.anonymousUserId }
    });

    const profile = await this.prisma.profile.upsert({
      where: { userId: user.id },
      update: toProfileWrite(input),
      create: {
        userId: user.id,
        ...toProfileWrite(input)
      }
    });

    return toProfileDto(profile, user.anonymousUserId ?? input.anonymousUserId);
  }

  async upsertUserProfile(userId: string, input: UpsertUserProfileRequest): Promise<ProfileDto> {
    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: toProfileWrite(input),
      create: {
        userId,
        ...toProfileWrite(input)
      }
    });

    return toProfileDto(profile, "");
  }

  async getMemorySignals(profileId: string): Promise<ProfileMemorySignalsDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { memorySignals: true }
    });
    return normalizeMemorySignals(profile?.memorySignals);
  }

  async rememberCompletedConsultation(input: RememberCompletedConsultationInput): Promise<ProfileMemorySignalsDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: input.profileId },
      select: { memorySignals: true }
    });
    const incoming = extractProfileMemorySignals({
      consultationId: input.consultationId,
      question: input.question,
      answer: input.answer,
      tone: input.tone
    });
    const merged = mergeProfileMemorySignals(normalizeMemorySignals(profile?.memorySignals), incoming);

    await this.prisma.profile.update({
      where: { id: input.profileId },
      data: { memorySignals: toJsonObject(merged) }
    });

    return merged;
  }
}

function toProfileWrite(input: UpsertUserProfileRequest) {
  return {
    displayName: input.displayName ?? null,
    birthTime: new Date(input.birthTime),
    birthTimezone: input.birthTimezone,
    gender: input.gender,
    birthPlace: input.birthPlace ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null
  };
}

function toProfileDto(
  profile: {
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
  },
  anonymousUserId: string
): ProfileDto {
  return {
    id: profile.id,
    anonymousUserId,
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

function normalizeMemorySignals(value: unknown): ProfileMemorySignals {
  if (!value || typeof value !== "object") {
    return emptyMemorySignals();
  }
  const record = value as Partial<ProfileMemorySignals>;
  return {
    decisionTopics: Array.isArray(record.decisionTopics) ? record.decisionTopics.filter(isString) : [],
    riskStyle: typeof record.riskStyle === "string" ? record.riskStyle : "\u672a\u77e5",
    preferredTone: typeof record.preferredTone === "string" ? record.preferredTone : "\u7406\u6027\u7b56\u7565",
    sources: Array.isArray(record.sources) ? record.sources.filter(isString) : [],
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined
  };
}

function emptyMemorySignals(): ProfileMemorySignals {
  return {
    decisionTopics: [],
    riskStyle: "\u672a\u77e5",
    preferredTone: "\u7406\u6027\u7b56\u7565",
    sources: []
  };
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function toJsonObject(signals: ProfileMemorySignals): PrismaJsonObject {
  return {
    decisionTopics: signals.decisionTopics,
    riskStyle: signals.riskStyle,
    preferredTone: signals.preferredTone,
    sources: signals.sources,
    ...(signals.updatedAt ? { updatedAt: signals.updatedAt } : {})
  };
}
