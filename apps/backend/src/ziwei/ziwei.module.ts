import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { ZiweiController } from "./ziwei.controller";
import { ZiweiService } from "./ziwei.service";

@Module({
  imports: [PrismaModule],
  controllers: [ZiweiController],
  providers: [ZiweiService],
  exports: [ZiweiService]
})
export class ZiweiModule {}
