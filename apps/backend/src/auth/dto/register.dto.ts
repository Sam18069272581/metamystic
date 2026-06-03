import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import type { RegisterRequest } from "@metamystic/shared";

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}
