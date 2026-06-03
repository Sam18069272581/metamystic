import { IsIn, IsString, Length } from "class-validator";
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
}
