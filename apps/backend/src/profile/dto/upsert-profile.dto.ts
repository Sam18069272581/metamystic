import { IsDateString, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Length } from "class-validator";
import type { Gender, UpsertProfileRequest } from "@metamystic/shared";

export class UpsertProfileDto implements UpsertProfileRequest {
  @IsString()
  @Length(3, 128)
  anonymousUserId!: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  displayName?: string;

  @IsDateString()
  birthTime!: string;

  @IsString()
  @Length(1, 80)
  birthTimezone!: string;

  @IsIn(["female", "male", "non_binary", "unknown"])
  gender!: Gender;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  birthPlace?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
