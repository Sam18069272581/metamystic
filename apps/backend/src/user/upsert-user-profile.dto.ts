import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import type { CreateUserProfileRequest, Gender, UpsertUserProfileRequest } from "@metamystic/shared";
import { BirthInputDto } from "../profile/dto/birth-input.dto";

export class UpsertUserProfileDto implements UpsertUserProfileRequest {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  birthTime?: string;

  @IsOptional()
  @IsString()
  birthTimezone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => BirthInputDto)
  birthInput?: BirthInputDto;

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
