import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AstrologyController } from "./astrology.controller";
import { AstrologyService } from "./astrology.service";

@Module({
  imports: [PrismaModule],
  controllers: [AstrologyController],
  providers: [AstrologyService],
  exports: [AstrologyService]
})
export class AstrologyModule {}
