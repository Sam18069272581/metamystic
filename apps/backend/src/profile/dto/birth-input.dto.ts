import { Type } from "class-transformer";
import { IsBoolean, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Matches, ValidateNested } from "class-validator";
import type { BirthInputV2 } from "@metamystic/shared";

class BirthLocationDto {
  @IsString()
  name!: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}

export class BirthInputDto implements BirthInputV2 {
  @IsIn(["solar", "lunar"])
  calendarType!: BirthInputV2["calendarType"];

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  localDate!: string;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}(?::\d{2})?$/)
  localTime?: string;

  @IsString()
  timezone!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BirthLocationDto)
  location?: BirthLocationDto;

  @IsIn(["exact", "hour", "unknown"])
  timePrecision!: BirthInputV2["timePrecision"];

  @IsBoolean()
  trueSolarTime!: boolean;

  @IsIn(["nextDay", "sameDay"])
  lateZiHourRule!: BirthInputV2["lateZiHourRule"];

  @IsOptional()
  @IsBoolean()
  lunarLeapMonth?: boolean;
}
