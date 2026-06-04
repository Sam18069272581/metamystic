import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import type { ApiResponse, AuthUserDto, CompatibilityReadingDto } from "@metamystic/shared";
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
}
