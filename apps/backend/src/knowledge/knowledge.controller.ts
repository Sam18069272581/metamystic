import { Controller, Get, Query } from "@nestjs/common";
import type { ApiResponse, KnowledgeSearchResponse } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { KnowledgeService } from "./knowledge.service";

@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get("search")
  async search(@Query("q") query = ""): Promise<ApiResponse<KnowledgeSearchResponse>> {
    return ok(await this.knowledgeService.search(query));
  }
}
