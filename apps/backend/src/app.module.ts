import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AstrologyModule } from "./astrology/astrology.module";
import { AuthModule } from "./auth/auth.module";
import { BaziModule } from "./bazi/bazi.module";
import { ConsultationModule } from "./consultation/consultation.module";
import { HealthModule } from "./health/health.module";
import { KnowledgeModule } from "./knowledge/knowledge.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProfileModule } from "./profile/profile.module";
import { SafetyModule } from "./safety/safety.module";
import { UserModule } from "./user/user.module";
import { ZiweiModule } from "./ziwei/ziwei.module";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ["../../.env", ".env"], isGlobal: true }),
    PrismaModule,
    AuthModule,
    HealthModule,
    SafetyModule,
    KnowledgeModule,
    ProfileModule,
    UserModule,
    BaziModule,
    ConsultationModule,
    ZiweiModule,
    AstrologyModule
  ]
})
export class AppModule {}
