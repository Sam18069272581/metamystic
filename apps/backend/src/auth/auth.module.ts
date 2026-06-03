import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { GoogleOAuthService } from "./google-oauth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    { provide: TokenService, useFactory: () => new TokenService() },
    GoogleOAuthService,
    JwtAuthGuard,
    RolesGuard
  ],
  exports: [AuthService, TokenService, JwtAuthGuard, RolesGuard]
})
export class AuthModule {}
