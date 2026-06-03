import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthUserDto } from "@metamystic/shared";
import { AuthService } from "../auth.service";
import { readCookie } from "../auth-cookies";
import { TokenService } from "../token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: AuthUserDto;
    }>();
    const token = getBearerToken(request.headers.authorization) ?? readCookie(request.headers.cookie, "access_token");
    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }
    const payload = this.tokenService.verifyAccessToken(token);
    request.user = await this.authService.getCurrentUser(payload.sub);
    return true;
  }
}

function getBearerToken(header: string | undefined): string | undefined {
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }
  return header.slice("Bearer ".length);
}
