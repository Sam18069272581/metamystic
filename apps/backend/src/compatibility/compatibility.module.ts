import { Module } from "@nestjs/common";
import { BaziModule } from "../bazi/bazi.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CompatibilityController } from "./compatibility.controller";
import { CompatibilityService } from "./compatibility.service";

@Module({
  imports: [PrismaModule, BaziModule],
  controllers: [CompatibilityController],
  providers: [CompatibilityService]
})
export class CompatibilityModule {}
