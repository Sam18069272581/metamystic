import { IsString, Length } from "class-validator";
import type { CreateBaziChartRequest } from "@metamystic/shared";

export class CreateBaziChartDto implements CreateBaziChartRequest {
  @IsString()
  @Length(8, 128)
  profileId!: string;
}
