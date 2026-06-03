import { Module } from "@nestjs/common";
import { BaziModule } from "../bazi/bazi.module";
import { KnowledgeModule } from "../knowledge/knowledge.module";
import { ProfileModule } from "../profile/profile.module";
import { SafetyModule } from "../safety/safety.module";
import { ConsultationController } from "./consultation.controller";
import { ConsultationService } from "./consultation.service";
import { ConfigService } from "@nestjs/config";
import { createAiProvider } from "./ai-provider";

@Module({
  imports: [BaziModule, SafetyModule, KnowledgeModule, ProfileModule],
  controllers: [ConsultationController],
  providers: [
    ConsultationService,
    {
      provide: "AI_PROVIDER",
      inject: [ConfigService],
      useFactory: createAiProvider
    }
  ],
  exports: [ConsultationService]
})
export class ConsultationModule {}
