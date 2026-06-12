import { Module } from "@nestjs/common";
import { AstrologyModule } from "../astrology/astrology.module";
import { AuthModule } from "../auth/auth.module";
import { BaziModule } from "../bazi/bazi.module";
import { ConsultationModule } from "../consultation/consultation.module";
import { ProfileModule } from "../profile/profile.module";
import { ZiweiModule } from "../ziwei/ziwei.module";
import { DailyFortuneService } from "./daily-fortune.service";
import { UserChartService } from "./user-chart.service";
import { UserController } from "./user.controller";

@Module({
  imports: [AstrologyModule, AuthModule, BaziModule, ConsultationModule, ProfileModule, ZiweiModule],
  controllers: [UserController],
  providers: [DailyFortuneService, UserChartService]
})
export class UserModule {}
