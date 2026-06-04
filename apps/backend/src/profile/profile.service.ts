import { Injectable, NotFoundException } from "@nestjs/common";
import type {
  ConsultationTone,
  CreateUserProfileRequest,
  ProfileDto,
  ProfileMemorySignalsDto,
  UpsertProfileRequest,
  UpsertUserProfileRequest,
  UserProfileListResponse
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

    const existingProfile = await this.prisma.profile.findFirst({
      where: { userId: user.id, isDefault: true },
      orderBy: { createdAt: "asc" }
    });
    const data = toProfileWrite(input);
    const profile = existingProfile
      ? await this.prisma.profile.update({
          where: { id: existingProfile.id },
          data
        })
      : await this.prisma.profile.create({
          data: {
            userId: user.id,
            label: input.displayName ?? "self",
            isDefault: true,
            ...data
          }
        });

    return toProfileDto(profile, user.anonymousUserId ?? input.anonymousUserId);
  }

  async upsertUserProfile(userId: string, input: UpsertUserProfileRequest): Promise<ProfileDto> {
    const existingProfile = await this.prisma.profile.findFirst({
      where: { userId, isDefault: true },
      orderBy: { createdAt: "asc" }
    });
    if (!existingProfile) {
      return this.createUserProfile(userId, {
        ...input,
        label: input.displayName ?? "self",
        isDefault: true
      });
    }

    const profile = await this.prisma.profile.update({
      where: { id: existingProfile.id },
      data: toProfileWrite(input)
    });

    return toProfileDto(profile, "");
  }

  async listUserProfiles(userId: string): Promise<UserProfileListResponse> {
    const profiles = await this.prisma.profile.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
    });
    return {
      profiles: profiles.map((profile) => toProfileDto(profile, "")),
      defaultProfileId: profiles.find((profile) => profile.isDefault)?.id ?? profiles[0]?.id
    };
  }

  async createUserProfile(userId: string, input: CreateUserProfileRequest): Promise<ProfileDto> {
    const profileCount = await this.prisma.profile.count({ where: { userId } });
    const isDefault = profileCount === 0 ? true : input.isDefault ?? false;
    if (isDefault && profileCount > 0) {
      await this.prisma.profile.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    const profile = await this.prisma.profile.create({
      data: {
        userId,
        label: input.label ?? input.displayName ?? "self",
        isDefault,
        ...toProfileWrite(input)
      }
    });

    return toProfileDto(profile, "");
  }

  async setDefaultUserProfile(userId: string, profileId: string): Promise<ProfileDto> {
    const existingProfile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId }
    });
    if (!existingProfile) {
      throw new NotFoundException("Profile not found");
    }

    const [, profile] = await this.prisma.$transaction([
      this.prisma.profile.updateMany({
        where: { userId },
        data: { isDefault: false }
      }),
      this.prisma.profile.update({
        where: { id: profileId },
        data: { isDefault: true }
      })
    ]);
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
    label?: string | null;
    isDefault?: boolean;
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
    label: profile.label ?? undefined,
    isDefault: profile.isDefault ?? false,
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
