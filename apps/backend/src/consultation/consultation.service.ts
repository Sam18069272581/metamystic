import { ForbiddenException, Inject, Injectable, Logger, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import type {
  BaziChartDto,
  ConsultationDto,
  ConsultationHistoryDto,
  ConsultationListResponse,
  ConsultationStreamEvent,
  FiveElement
} from "@metamystic/shared";
import { finalize, Observable, shareReplay } from "rxjs";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { asPrismaJson } from "../prisma/prisma-json";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "../profile/profile.service";
import { SafetyService } from "../safety/safety.service";
import type { AiProvider, AiProviderStatusEvent } from "./ai-provider";
import { AiAccessPolicyError, AiAccessPolicyService } from "./ai-access-policy.service";
import type { CreateConsultationDto } from "./dto/create-consultation.dto";

interface ConsultationMessageRecord {
  id: string;
  consultationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

interface ConsultationRecord {
  id: string;
  userId?: string;
  profileId: string;
  chartId: string;
  question: string;
  tone: "strategic" | "gentle";
  status: "pending" | "streaming" | "completed" | "failed";
  summary: string | null;
  createdAt: Date;
  locale?: string;
  accessMode?: string;
  charged?: boolean;
  accessRemaining?: number | null;
  accessResetsAt?: Date | null;
  metadata?: unknown;
}

interface ConsultationStreamRecord extends ConsultationRecord {
  chart: {
    id: string;
    profileId: string;
    dayMaster: string;
    dayMasterStatus: string;
    mainPattern: string;
    pillars: unknown;
    elements: unknown;
    metadata?: unknown;
    createdAt: Date;
  };
  user?: {
    anonymousUserId: string | null;
    email: string | null;
  };
}

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);
  private readonly activeStreams = new Map<string, Observable<MessageEvent>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
    private readonly knowledgeService: KnowledgeService,
    @Inject("AI_PROVIDER") private readonly aiProvider: AiProvider,
    private readonly profileService: ProfileService,
    private readonly aiAccessPolicy: AiAccessPolicyService
  ) {}

  async createConsultation(input: CreateConsultationDto): Promise<ConsultationDto> {
    return this.createOwnedConsultation(input, input.anonymousUserId ? { anonymousUserId: input.anonymousUserId } : {});
  }

  async createUserConsultation(userId: string, input: CreateConsultationDto): Promise<ConsultationDto> {
    return this.createOwnedConsultation(input, { userId });
  }

  private async createOwnedConsultation(
    input: CreateConsultationDto,
    owner: { userId?: string; anonymousUserId?: string }
  ): Promise<ConsultationDto> {
    const profile = await this.prisma.profile.findUnique({ where: { id: input.profileId }, include: { user: true } });

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (owner.userId && profile.userId !== owner.userId) {
      throw new ForbiddenException("Profile does not belong to current user");
    }
    if (!owner.userId && (!owner.anonymousUserId || profile.user.email !== null || profile.user.anonymousUserId !== owner.anonymousUserId)) {
      throw new NotFoundException("Profile not found");
    }
    const chart = await this.prisma.baziChart.findUnique({ where: { id: input.chartId } });
    if (!chart || chart.profileId !== profile.id) {
      throw new NotFoundException("Bazi chart not found for this profile");
    }

    const safety = this.safety.evaluateQuestion(input.question);
    if (!safety.allowed) {
      throw new UnprocessableEntityException(safety.reason);
    }

    if (input.idempotencyKey) {
      const existing = await this.prisma.consultation.findUnique({
        where: { userId_idempotencyKey: { userId: profile.userId, idempotencyKey: input.idempotencyKey } }
      });
      if (existing) {
        return this.toConsultationDto(existing);
      }
    }

    const ownerType = profile.user.email === null ? "anonymous" : "user";
    const access = await this.aiAccessPolicy.assertAvailable({ userId: profile.userId, ownerType });

    try {
      const consultation = await this.prisma.consultation.create({
        data: {
          userId: profile.userId,
          profileId: profile.id,
          chartId: chart.id,
          question: input.question,
          tone: input.tone,
          idempotencyKey: input.idempotencyKey ?? null,
          promptVersion: "consultation-v2",
          retrievalVersion: "hybrid-v1",
          locale: input.locale ?? "zh",
          accessMode: access.mode,
          charged: access.charged,
          accessRemaining: access.remaining,
          accessResetsAt: new Date(access.resetsAt),
          metadata: { disclaimer: safety.disclaimer },
          messages: {
            create: {
              role: "user",
              content: input.question
            }
          }
        }
      });
      return this.toConsultationDto(consultation);
    } catch (error) {
      if (input.idempotencyKey && isUniqueConstraintError(error)) {
        const existing = await this.prisma.consultation.findUnique({
          where: { userId_idempotencyKey: { userId: profile.userId, idempotencyKey: input.idempotencyKey } }
        });
        if (existing) return this.toConsultationDto(existing);
      }
      throw error;
    }
  }

  async getHistory(id: string, anonymousUserId: string | undefined): Promise<ConsultationHistoryDto> {
    if (!anonymousUserId) {
      throw new NotFoundException("Consultation not found");
    }
    const consultation = await this.prisma.consultation.findFirst({
      where: {
        id,
        user: { anonymousUserId, email: null }
      },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    return {
      consultation: this.toConsultationDto(consultation),
      messages: consultation.messages.map((message: ConsultationMessageRecord) => ({
        id: message.id,
        consultationId: message.consultationId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString()
      }))
    };
  }

  async getUserHistory(userId: string, id: string): Promise<ConsultationHistoryDto> {
    const consultation = await this.prisma.consultation.findFirst({
      where: { id, userId },
      include: { messages: { orderBy: { createdAt: "asc" } } }
    });
    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    return {
      consultation: this.toConsultationDto(consultation),
      messages: consultation.messages.map((message: ConsultationMessageRecord) => ({
        id: message.id,
        consultationId: message.consultationId,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt.toISOString()
      }))
    };
  }

  async listRecentByProfile(profileId: string, take = 10): Promise<ConsultationListResponse> {
    void take;
    return this.toConsultationList(profileId, []);
  }

  async listUserRecentByProfile(userId: string, profileId: string, take = 10): Promise<ConsultationListResponse> {
    const profile = await this.prisma.profile.findFirst({
      where: { id: profileId, userId },
      select: { id: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    const consultations = await this.prisma.consultation.findMany({
      where: { profileId, userId },
      orderBy: { createdAt: "desc" },
      take
    });

    return this.toConsultationList(profileId, consultations);
  }

  private toConsultationList(profileId: string, consultations: ConsultationRecord[]): ConsultationListResponse {
    return {
      profileId,
      consultations: consultations.map((consultation: ConsultationRecord) => this.toConsultationDto(consultation))
    };
  }

  streamConsultation(id: string, anonymousUserId: string | undefined): Observable<MessageEvent> {
    return this.streamConsultationRecord(`anonymous:${anonymousUserId ?? "missing"}:${id}`, id, async () => {
      if (!anonymousUserId) {
        throw new NotFoundException("Consultation not found");
      }
      const consultation = await this.prisma.consultation.findFirst({
        where: {
          id,
          user: { anonymousUserId, email: null }
        },
        include: { chart: true, user: { select: { anonymousUserId: true, email: true } } }
      });
      if (!consultation) {
        throw new NotFoundException("Consultation not found");
      }
      return consultation;
    });
  }

  streamUserConsultation(userId: string, id: string): Observable<MessageEvent> {
    return this.streamConsultationRecord(`user:${userId}:${id}`, id, async () => {
      const consultation = await this.prisma.consultation.findFirst({
        where: { id, userId },
        include: { chart: true, user: { select: { anonymousUserId: true, email: true } } }
      });
      if (!consultation) {
        throw new NotFoundException("Consultation not found");
      }
      return consultation;
    });
  }

  private streamConsultationRecord(
    executionKey: string,
    id: string,
    loadConsultation: () => Promise<ConsultationStreamRecord>
  ): Observable<MessageEvent> {
    const active = this.activeStreams.get(executionKey);
    if (active) return active;
    const stream = new Observable<MessageEvent>((subscriber) => {
      void this.runStream(id, loadConsultation, (event) => subscriber.next({ data: event })).then(
        () => subscriber.complete(),
        (error: unknown) => {
          subscriber.next({
            data: {
              type: "error",
              consultationId: id,
              message: error instanceof Error ? error.message : "AI stream failed"
            }
          });
          subscriber.complete();
        }
      );
    }).pipe(
      finalize(() => this.activeStreams.delete(executionKey)),
      shareReplay({ bufferSize: 100, refCount: false })
    );
    this.activeStreams.set(executionKey, stream);
    return stream;
  }

  private async runStream(
    id: string,
    loadConsultation: () => Promise<ConsultationStreamRecord>,
    emit: (event: ConsultationStreamEvent) => void
  ): Promise<void> {
    const consultation = await loadConsultation();

    if (consultation.status === "completed") {
      emit({ type: "done", consultationId: id });
      return;
    }

    const claim = await this.prisma.consultation.updateMany({
      where: { id, status: "pending" },
      data: { status: "streaming", startedAt: new Date(), errorCode: null }
    });
    if (claim.count === 0) {
      await this.waitForTerminalStatus(id);
      emit({ type: "done", consultationId: id });
      return;
    }

    const answer: string[] = [];

    try {
      const access = await this.aiAccessPolicy.consume({
        userId: consultation.userId ?? "",
        ownerType: consultation.user?.email === null ? "anonymous" : "user"
      });
      await this.prisma.consultation.update({
        where: { id },
        data: {
          accessMode: access.mode,
          charged: access.charged,
          accessRemaining: access.remaining,
          accessResetsAt: new Date(access.resetsAt)
        }
      });
      const chart = this.toBaziChartDto(consultation.chart);
      const safety = this.safety.evaluateQuestion(consultation.question);
      const knowledge = await this.knowledgeService.search(
        `${consultation.question} ${chart.mainPattern} ${chart.dayMasterStatus}`,
        3
      );
      if (knowledge.trace) {
        await this.prisma.consultation.update({
          where: { id },
          data: {
            retrievalVersion: knowledge.retrievalVersion,
            metadata: asPrismaJson({
              ...asRecord(consultation.metadata),
              retrieval: knowledge.trace
            })
          }
        });
      }
      for await (const chunk of this.aiProvider.streamConsultation({
        question: consultation.question,
        tone: consultation.tone,
        chart,
        citations: knowledge.chunks,
        disclaimer: safety.disclaimer
      })) {
        if (isAiProviderStatusEvent(chunk)) {
          emit({
            type: "provider",
            consultationId: id,
            providerName: chunk.providerName,
            model: chunk.model,
            status: chunk.status,
            isFallback: chunk.isFallback,
            failedProviderName: chunk.failedProviderName,
            reason: chunk.reason,
            durationMs: chunk.durationMs
          });
          continue;
        }
        answer.push(chunk.content);
        emit({
          type: "chunk",
          consultationId: id,
          section: chunk.section,
          content: chunk.content
        });
      }

      const summary = answer.join("\n\n");
      await this.prisma.$transaction([
        this.prisma.consultationMessage.create({
          data: {
            consultationId: id,
            role: "assistant",
            content: summary
          }
        }),
        this.prisma.consultation.update({
          where: { id },
          data: {
            status: "completed",
            summary: summary.slice(0, 280),
            finishedAt: new Date()
          }
        })
      ]);

      try {
        await this.profileService.rememberCompletedConsultation({
          profileId: consultation.profileId,
          consultationId: id,
          question: consultation.question,
          answer: summary,
          tone: consultation.tone
        });
      } catch (error) {
        this.logger.warn(
          `Failed to update profile memory for consultation ${id}. ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      emit({ type: "done", consultationId: id });
    } catch (error) {
      await this.prisma.consultation.update({
        where: { id },
        data: {
          status: "failed",
          finishedAt: new Date(),
          errorCode:
            error instanceof AiAccessPolicyError
              ? error.code
              : error instanceof Error
                ? error.name
                : "AI_STREAM_FAILED"
        }
      });
      throw error;
    }
  }

  private async waitForTerminalStatus(id: string): Promise<void> {
    const timeoutAt = Date.now() + 60_000;
    while (Date.now() < timeoutAt) {
      const current = await this.prisma.consultation.findUnique({
        where: { id },
        select: { status: true, errorCode: true }
      });
      if (!current) {
        throw new NotFoundException("Consultation not found");
      }
      if (current.status === "completed") return;
      if (current.status === "failed") {
        throw new Error(current.errorCode ?? "AI stream failed");
      }
      await delay(50);
    }
    throw new Error("Consultation stream is still running");
  }

  private toConsultationDto(consultation: {
    id: string;
    profileId: string;
    chartId: string;
    question: string;
    tone: "strategic" | "gentle";
    status: "pending" | "streaming" | "completed" | "failed";
    summary: string | null;
    createdAt: Date;
    locale?: string;
    accessMode?: string;
    charged?: boolean;
    accessRemaining?: number | null;
    accessResetsAt?: Date | null;
  }): ConsultationDto {
    return {
      id: consultation.id,
      profileId: consultation.profileId,
      chartId: consultation.chartId,
      question: consultation.question,
      tone: consultation.tone,
      status: consultation.status,
      summary: consultation.summary ?? undefined,
      createdAt: consultation.createdAt.toISOString(),
      access: {
        mode: normalizeAccessMode(consultation.accessMode),
        charged: consultation.charged ?? false,
        remaining: consultation.accessRemaining ?? 0,
        resetsAt: consultation.accessResetsAt?.toISOString() ?? new Date(0).toISOString()
      }
    };
  }

  private toBaziChartDto(chart: {
    id: string;
    profileId: string;
    dayMaster: string;
    dayMasterStatus: string;
    mainPattern: string;
    pillars: unknown;
    elements: unknown;
    metadata?: unknown;
    createdAt: Date;
  }): BaziChartDto {
    const metadata = chart.metadata && typeof chart.metadata === "object" ? (chart.metadata as Record<string, unknown>) : {};
    return {
      id: chart.id,
      profileId: chart.profileId,
      dayMaster: chart.dayMaster,
      dayMasterStatus: chart.dayMasterStatus as BaziChartDto["dayMasterStatus"],
      mainPattern: chart.mainPattern,
      pillars: chart.pillars as BaziChartDto["pillars"],
      elements: chart.elements as Record<FiveElement, number>,
      analysis: metadata.analysis as BaziChartDto["analysis"],
      metadata,
      createdAt: chart.createdAt.toISOString()
    };
  }
}

function isAiProviderStatusEvent(event: unknown): event is AiProviderStatusEvent {
  return Boolean(event && typeof event === "object" && "type" in event && event.type === "provider");
}

function isUniqueConstraintError(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeAccessMode(value: string | undefined): "public_beta" | "metered" | "subscription" {
  return value === "metered" || value === "subscription" ? value : "public_beta";
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
