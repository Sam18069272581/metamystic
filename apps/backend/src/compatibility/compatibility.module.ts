import { Module } from "@nestjs/common";
import { BaziModule } from "../bazi/bazi.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CompatibilityController, PublicCompatibilityController } from "./compatibility.controller";
import { CompatibilityService } from "./compatibility.service";

@Module({
  imports: [PrismaModule, BaziModule],
  controllers: [CompatibilityController, PublicCompatibilityController],
  providers: [CompatibilityService]
})
export class CompatibilityModule {}
