import { IsIn, IsOptional, IsString, IsUUID, Length } from "class-validator";
import type { ConsultationTone, CreateConsultationRequest } from "@metamystic/shared";

export class CreateConsultationDto implements CreateConsultationRequest {
  @IsString()
  @Length(8, 128)
  profileId!: string;

  @IsString()
  @Length(8, 128)
  chartId!: string;

  @IsString()
  @Length(2, 500)
  question!: string;

  @IsIn(["strategic", "gentle"])
  tone!: ConsultationTone;

  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  @Length(3, 128)
  anonymousUserId?: string;
}
