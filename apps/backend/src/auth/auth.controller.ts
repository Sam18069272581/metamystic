import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import type { ApiResponse, AuthSessionDto, AuthUserDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { AuthService } from "./auth.service";
import { clearAuthCookies, readCookie, setAuthCookies } from "./auth-cookies";
import { CurrentUser } from "./decorators/current-user.decorator";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleOAuthService } from "./google-oauth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleOAuth: GoogleOAuthService
  ) {}

  @Post("register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) response: Response): Promise<ApiResponse<AuthSessionDto>> {
    const session = await this.authService.register(dto);
    setAuthCookies(response, session);
    return ok(session);
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<ApiResponse<AuthSessionDto>> {
    const session = await this.authService.login(dto);
    setAuthCookies(response, session);
    return ok(session);
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<ApiResponse<AuthSessionDto>> {
    const refreshToken = readCookie(request.headers.cookie, "refresh_token");
    const session = await this.authService.refresh(refreshToken ?? "");
    setAuthCookies(response, session);
    return ok(session);
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) response: Response): ApiResponse<{ success: true }> {
    clearAuthCookies(response);
    return ok({ success: true });
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUserDto): ApiResponse<AuthUserDto> {
    return ok(user);
  }

  @Get("google")
  google(@Res() response: Response): void {
    response.redirect(this.googleOAuth.getAuthorizationUrl());
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Res() response: Response
  ): Promise<void> {
    const profile = await this.googleOAuth.exchangeCode(code);
    const session = await this.authService.loginWithGoogle(profile);
    setAuthCookies(response, session);
    response.redirect(`${process.env.FRONTEND_APP_URL ?? "http://localhost:3000"}/me`);
  }
}
