import { IsString } from "class-validator";
import type { CreateCompatibilityRequest } from "@metamystic/shared";

export class CreateCompatibilityDto implements CreateCompatibilityRequest {
  @IsString()
  profileAId!: string;

  @IsString()
  profileBId!: string;
}
