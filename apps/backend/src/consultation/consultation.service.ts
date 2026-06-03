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
import { Observable } from "rxjs";
import { KnowledgeService } from "../knowledge/knowledge.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "../profile/profile.service";
import { SafetyService } from "../safety/safety.service";
import type { AiProvider } from "./ai-provider";
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
  profileId: string;
  chartId: string;
  question: string;
  tone: "strategic" | "gentle";
  status: "pending" | "streaming" | "completed" | "failed";
  summary: string | null;
  createdAt: Date;
}

@Injectable()
export class ConsultationService {
  private readonly logger = new Logger(ConsultationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
    private readonly knowledgeService: KnowledgeService,
    @Inject("AI_PROVIDER") private readonly aiProvider: AiProvider,
    private readonly profileService: ProfileService
  ) {}

  async createConsultation(input: CreateConsultationDto): Promise<ConsultationDto> {
    const [profile, chart] = await Promise.all([
      this.prisma.profile.findUnique({ where: { id: input.profileId }, include: { user: true } }),
      this.prisma.baziChart.findUnique({ where: { id: input.chartId } })
    ]);

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (!chart || chart.profileId !== profile.id) {
      throw new NotFoundException("Bazi chart not found for this profile");
    }

    const safety = this.safety.evaluateQuestion(input.question);
    if (!safety.allowed) {
      throw new UnprocessableEntityException(safety.reason);
    }

    const consultation = await this.prisma.consultation.create({
      data: {
        userId: profile.userId,
        profileId: profile.id,
        chartId: chart.id,
        question: input.question,
        tone: input.tone,
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
  }

  async createUserConsultation(userId: string, input: CreateConsultationDto): Promise<ConsultationDto> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: input.profileId },
      select: { userId: true }
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    if (profile.userId !== userId) {
      throw new ForbiddenException("Profile does not belong to current user");
    }
    const chart = await this.prisma.baziChart.findUnique({
      where: { id: input.chartId },
      select: { profileId: true }
    });
    if (!chart || chart.profileId !== input.profileId) {
      throw new NotFoundException("Bazi chart not found for this profile");
    }
    return this.createConsultation(input);
  }

  async getHistory(id: string): Promise<ConsultationHistoryDto> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
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
    const consultations = await this.prisma.consultation.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      take
    });

    return {
      profileId,
      consultations: consultations.map((consultation: ConsultationRecord) => this.toConsultationDto(consultation))
    };
  }

  streamConsultation(id: string): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      void this.runStream(id, (event) => subscriber.next({ data: event })).then(
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
    });
  }

  private async runStream(
    id: string,
    emit: (event: ConsultationStreamEvent) => void
  ): Promise<void> {
    const consultation = await this.prisma.consultation.findUnique({
      where: { id },
      include: { chart: true }
    });
    if (!consultation) {
      throw new NotFoundException("Consultation not found");
    }

    await this.prisma.consultation.update({
      where: { id },
      data: { status: "streaming" }
    });

    const chart = this.toBaziChartDto(consultation.chart);
    const safety = this.safety.evaluateQuestion(consultation.question);
    const knowledge = await this.knowledgeService.search(
      `${consultation.question} ${chart.mainPattern} ${chart.dayMasterStatus}`,
      3
    );
    const answer: string[] = [];

    try {
      for await (const chunk of this.aiProvider.streamConsultation({
        question: consultation.question,
        tone: consultation.tone,
        chart,
        citations: knowledge.chunks,
        disclaimer: safety.disclaimer
      })) {
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
            summary: summary.slice(0, 280)
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
        data: { status: "failed" }
      });
      throw error;
    }
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
  }): ConsultationDto {
    return {
      id: consultation.id,
      profileId: consultation.profileId,
      chartId: consultation.chartId,
      question: consultation.question,
      tone: consultation.tone,
      status: consultation.status,
      summary: consultation.summary ?? undefined,
      createdAt: consultation.createdAt.toISOString()
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
