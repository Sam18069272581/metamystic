import { Module } from "@nestjs/common";
import { BaziController } from "./bazi.controller";
import { BaziService } from "./bazi.service";
import { TymeBaziEngine } from "./bazi-engine";

@Module({
  controllers: [BaziController],
  providers: [BaziService, { provide: "BAZI_ENGINE", useClass: TymeBaziEngine }],
  exports: [BaziService]
})
export class BaziModule {}
