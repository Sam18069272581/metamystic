import { IsString, MinLength } from "class-validator";
import type { CreateAstrologyChartRequest } from "@metamystic/shared";

export class CreateAstrologyChartDto implements CreateAstrologyChartRequest {
  @IsString()
  @MinLength(1)
  profileId!: string;
}
