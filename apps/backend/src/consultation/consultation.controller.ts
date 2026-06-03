import { Body, Controller, Get, Param, Post, Query, Sse } from "@nestjs/common";
import type { MessageEvent } from "@nestjs/common";
import type {
  ApiResponse,
  ConsultationDto,
  ConsultationHistoryDto,
  ConsultationListResponse,
  ConsultationStreamEvent
} from "@metamystic/shared";
import { Observable } from "rxjs";
import { ok } from "../shared/api-response";
import { ConsultationService } from "./consultation.service";
import { CreateConsultationDto } from "./dto/create-consultation.dto";

@Controller("consultations")
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) {}

  @Post()
  async createConsultation(@Body() dto: CreateConsultationDto): Promise<ApiResponse<ConsultationDto>> {
    return ok(await this.consultationService.createConsultation(dto));
  }

  @Get()
  async listConsultations(@Query("profileId") profileId: string): Promise<ApiResponse<ConsultationListResponse>> {
    return ok(await this.consultationService.listRecentByProfile(profileId));
  }

  @Get(":id")
  async getConsultation(@Param("id") id: string): Promise<ApiResponse<ConsultationHistoryDto>> {
    return ok(await this.consultationService.getHistory(id));
  }

  @Sse(":id/stream")
  streamConsultation(@Param("id") id: string): Observable<MessageEvent> {
    return this.consultationService.streamConsultation(id);
  }
}
