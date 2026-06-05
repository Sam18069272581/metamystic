import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type {
  ApiResponse,
  AuthUserDto,
  CompatibilityReadingDto,
  CompatibilityReadingListResponse,
  PublicCompatibilityShareDto
} from "@metamystic/shared";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ok } from "../shared/api-response";
import { CompatibilityService } from "./compatibility.service";
import { CreateCompatibilityDto } from "./dto/create-compatibility.dto";

@UseGuards(JwtAuthGuard)
@Controller("users/me/compatibility")
export class CompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Post()
  async createReading(
    @CurrentUser() user: AuthUserDto,
    @Body() dto: CreateCompatibilityDto
  ): Promise<ApiResponse<CompatibilityReadingDto>> {
    return ok(await this.compatibilityService.analyzeUserProfiles(user.id, dto));
  }

  @Get()
  async listReadings(@CurrentUser() user: AuthUserDto): Promise<ApiResponse<CompatibilityReadingListResponse>> {
    return ok(await this.compatibilityService.listUserReadings(user.id));
  }

  @Get(":readingId")
  async getReading(
    @CurrentUser() user: AuthUserDto,
    @Param("readingId") readingId: string
  ): Promise<ApiResponse<CompatibilityReadingDto>> {
    return ok(await this.compatibilityService.getUserReading(user.id, readingId));
  }
}

@Controller("compatibility")
export class PublicCompatibilityController {
  constructor(private readonly compatibilityService: CompatibilityService) {}

  @Get(":readingId/share")
  async getShareReading(@Param("readingId") readingId: string): Promise<ApiResponse<PublicCompatibilityShareDto>> {
    return ok(await this.compatibilityService.getPublicShareReading(readingId));
  }
}
