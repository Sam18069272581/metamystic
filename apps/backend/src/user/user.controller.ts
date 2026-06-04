import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  ApiResponse,
  AstrologyChartDto,
  AuthUserDto,
  BaziChartDto,
  ConsultationDto,
  ConsultationHistoryDto,
  ProfileDto,
  UserChartArchiveDto,
  UserChartDetailDto,
  UserChartKind,
  UserProfileListResponse,
  ZiweiChartDto
} from "@metamystic/shared";
import { AstrologyService } from "../astrology/astrology.service";
import { BaziService } from "../bazi/bazi.service";
import { ConsultationService } from "../consultation/consultation.service";
import { CreateConsultationDto } from "../consultation/dto/create-consultation.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ProfileService } from "../profile/profile.service";
import { ok } from "../shared/api-response";
import { ZiweiService } from "../ziwei/ziwei.service";
import { UserChartService } from "./user-chart.service";
import { CreateUserProfileDto, UpsertUserProfileDto } from "./upsert-user-profile.dto";

@UseGuards(JwtAuthGuard)
@Controller("users/me")
export class UserController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly baziService: BaziService,
    private readonly consultationService: ConsultationService,
    private readonly ziweiService: ZiweiService,
    private readonly astrologyService: AstrologyService,
    private readonly userChartService: UserChartService
  ) {}

  @Get("charts")
  async listCharts(@CurrentUser() user: AuthUserDto): Promise<ApiResponse<UserChartArchiveDto>> {
    return ok(await this.userChartService.listMyCharts(user.id));
  }

  @Get("charts/:kind/:chartId")
  async getChart(
    @CurrentUser() user: AuthUserDto,
    @Param("kind") kind: UserChartKind,
    @Param("chartId") chartId: string
  ): Promise<ApiResponse<UserChartDetailDto>> {
    return ok(await this.userChartService.getMyChart(user.id, kind, chartId));
  }

  @Post("profile")
  async upsertProfile(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: UpsertUserProfileDto
  ): Promise<ApiResponse<ProfileDto>> {
    return ok(await this.profileService.upsertUserProfile(user.id, dto));
  }

  @Get("profiles")
  async listProfiles(@CurrentUser() user: AuthUserDto): Promise<ApiResponse<UserProfileListResponse>> {
    return ok(await this.profileService.listUserProfiles(user.id));
  }

  @Post("profiles")
  async createProfile(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: CreateUserProfileDto
  ): Promise<ApiResponse<ProfileDto>> {
    return ok(await this.profileService.createUserProfile(user.id, dto));
  }

  @Patch("profiles/:profileId/default")
  async setDefaultProfile(
    @CurrentUser() user: AuthUserDto,
    @Param("profileId") profileId: string
  ): Promise<ApiResponse<ProfileDto>> {
    return ok(await this.profileService.setDefaultUserProfile(user.id, profileId));
  }

  @Post("charts/bazi")
  async createBaziChart(
    @CurrentUser() user: AuthUserDto,
    @Body("profileId") profileId: string
  ): Promise<ApiResponse<BaziChartDto>> {
    return ok(await this.baziService.createUserChart(user.id, profileId));
  }

  @Post("consultations")
  async createConsultation(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: CreateConsultationDto
  ): Promise<ApiResponse<ConsultationDto>> {
    return ok(await this.consultationService.createUserConsultation(user.id, dto));
  }

  @Get("consultations/:id")
  async getConsultationHistory(
    @CurrentUser() user: AuthUserDto,
    @Param("id") id: string
  ): Promise<ApiResponse<ConsultationHistoryDto>> {
    return ok(await this.consultationService.getUserHistory(user.id, id));
  }

  @Post("charts/ziwei")
  async createZiweiChart(
    @CurrentUser() user: AuthUserDto,
    @Body("profileId") profileId: string
  ): Promise<ApiResponse<ZiweiChartDto>> {
    return ok(await this.ziweiService.createUserChart(user.id, profileId));
  }

  @Post("charts/astrology")
  async createAstrologyChart(
    @CurrentUser() user: AuthUserDto,
    @Body("profileId") profileId: string
  ): Promise<ApiResponse<AstrologyChartDto>> {
    return ok(await this.astrologyService.createUserChart(user.id, profileId));
  }
}
