import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import type { CreateUserProfileRequest, Gender, UpsertUserProfileRequest } from "@metamystic/shared";

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

export class CreateUserProfileDto extends UpsertUserProfileDto implements CreateUserProfileRequest {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
