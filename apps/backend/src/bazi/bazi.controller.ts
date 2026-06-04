import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import type { ApiResponse, BaziChartDto, PublicBaziShareDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { BaziService } from "./bazi.service";
import { CreateBaziChartDto } from "./dto/create-bazi-chart.dto";

@Controller("charts/bazi")
export class BaziController {
  constructor(private readonly baziService: BaziService) {}

  @Post()
  async createChart(@Body() dto: CreateBaziChartDto): Promise<ApiResponse<BaziChartDto>> {
    return ok(await this.baziService.createChart(dto.profileId));
  }

  @Get(":chartId/share")
  async getShareChart(@Param("chartId") chartId: string): Promise<ApiResponse<PublicBaziShareDto>> {
    return ok(await this.baziService.getPublicShareChart(chartId));
  }
}
