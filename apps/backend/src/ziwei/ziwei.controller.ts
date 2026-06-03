import { Body, Controller, Post } from "@nestjs/common";
import type { ApiResponse, ZiweiChartDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { ZiweiService } from "./ziwei.service";

@Controller("charts/ziwei")
export class ZiweiController {
  constructor(private readonly ziweiService: ZiweiService) {}

  @Post()
  async createChart(@Body("profileId") profileId: string): Promise<ApiResponse<ZiweiChartDto>> {
    return ok(await this.ziweiService.createChart(profileId));
  }
}
