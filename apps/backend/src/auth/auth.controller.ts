import { Body, Controller, Get, Post, Query, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { randomBytes, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import type { ApiResponse, AuthSessionDto, AuthUserDto } from "@metamystic/shared";
import { ok } from "../shared/api-response";
import { getFrontendAppUrl } from "../config/public-app-url";
import { AuthService } from "./auth.service";
import { clearAuthCookies, readCookie, setAuthCookies, setOAuthStateCookie } from "./auth-cookies";
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
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<ApiResponse<{ success: true }>> {
    await this.authService.revokeRefreshToken(readCookie(request.headers.cookie, "refresh_token") ?? "");
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
    const state = randomBytes(32).toString("base64url");
    setOAuthStateCookie(response, state);
    response.redirect(this.googleOAuth.getAuthorizationUrl(state));
  }

  @Get("google/callback")
  async googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() request: Request,
    @Res() response: Response
  ): Promise<void> {
    const expectedState = readCookie(request.headers.cookie, "oauth_state");
    if (!isMatchingState(state, expectedState)) {
      throw new UnauthorizedException("Invalid OAuth state");
    }
    const profile = await this.googleOAuth.exchangeCode(code);
    const session = await this.authService.loginWithGoogle(profile);
    setAuthCookies(response, session);
    response.redirect(`${getFrontendAppUrl(process.env)}/me?auth=google`);
  }
}

function isMatchingState(actual: string | undefined, expected: string | undefined): boolean {
  if (!actual || !expected) {
    return false;
  }
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
