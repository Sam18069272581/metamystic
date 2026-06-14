import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import type { ApiResponse, ProfileDto, ProfileMemorySignalsDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { UpsertProfileDto } from "./dto/upsert-profile.dto";
import { ProfileService } from "./profile.service";

@Controller("profiles")
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  async upsertProfile(@Body() dto: UpsertProfileDto): Promise<ApiResponse<ProfileDto>> {
    return ok(await this.profileService.upsertProfile(dto));
  }

  @Get(":id/memory")
  async getMemory(
    @Param("id") id: string,
    @Query("anonymousUserId") anonymousUserId: string | undefined
  ): Promise<ApiResponse<ProfileMemorySignalsDto>> {
    return ok(await this.profileService.getAnonymousMemorySignals(id, anonymousUserId));
  }
}
