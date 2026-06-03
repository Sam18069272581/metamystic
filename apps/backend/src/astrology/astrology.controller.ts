import { Body, Controller, Post } from "@nestjs/common";
import type { ApiResponse, AstrologyChartDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { AstrologyService } from "./astrology.service";
import { CreateAstrologyChartDto } from "./dto/create-astrology-chart.dto";

@Controller("charts/astrology")
export class AstrologyController {
  constructor(private readonly astrologyService: AstrologyService) {}

  @Post()
  async createChart(@Body() dto: CreateAstrologyChartDto): Promise<ApiResponse<AstrologyChartDto>> {
    return ok(await this.astrologyService.createChart(dto.profileId));
  }
}
