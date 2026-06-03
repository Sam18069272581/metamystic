import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import type { Gender, UpsertUserProfileRequest } from "@metamystic/shared";

export class UpsertUserProfileDto implements UpsertUserProfileRequest {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  birthTime!: string;

  @IsString()
  birthTimezone!: string;

  @IsEnum(["female", "male", "non_binary", "unknown"])
  gender!: Gender;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
