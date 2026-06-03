import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { AuthSessionDto, AuthUserDto, LoginRequest, RegisterRequest, UserRole } from "@metamystic/shared";
import { PrismaService } from "../prisma/prisma.service";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";

interface UserLike {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}

export interface GoogleUserProfile {
  providerAccountId: string;
  email: string;
  displayName?: string | undefined;
  avatarUrl?: string | undefined;
  emailVerified: boolean;
}

@Injectable()
export class AuthService {
  private readonly passwordService = new PasswordService();
  private readonly tokenService = new TokenService();

  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterRequest): Promise<AuthSessionDto> {
    const email = normalizeEmail(input.email);
    const existing = await this.prisma.authIdentity.findUnique({
      where: { provider_providerAccountId: { provider: "EMAIL", providerAccountId: email } }
    });
    if (existing) {
      throw new ConflictException("Email is already registered");
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = (await this.prisma.user.create({
      data: {
        email,
        displayName: input.displayName?.trim() || null,
        identities: {
          create: {
            provider: "EMAIL",
            providerAccountId: email,
            email,
            passwordHash
          }
        }
      }
    })) as UserLike;

    return this.createSession(user);
  }

  async login(input: LoginRequest): Promise<AuthSessionDto> {
    const email = normalizeEmail(input.email);
    const identity = await this.prisma.authIdentity.findUnique({
      where: { provider_providerAccountId: { provider: "EMAIL", providerAccountId: email } },
      include: { user: true }
    });
    if (!identity?.passwordHash || !identity.user) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const valid = await this.passwordService.verify(input.password, identity.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }
    return this.createSession(identity.user as UserLike);
  }

  async refresh(refreshToken: string): Promise<AuthSessionDto> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
    if (!stored || stored.revokedAt || stored.expiresAt <= new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });
    return this.createSession(stored.user as UserLike);
  }

  async loginWithGoogle(profile: GoogleUserProfile): Promise<AuthSessionDto> {
    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: profile.providerAccountId } },
      include: { user: true }
    });
    if (existingIdentity?.user) {
      return this.createSession(existingIdentity.user as UserLike);
    }

    const email = normalizeEmail(profile.email);
    const user = (await this.prisma.user.create({
      data: {
        email,
        displayName: profile.displayName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        emailVerifiedAt: profile.emailVerified ? new Date() : null,
        identities: {
          create: {
            provider: "GOOGLE",
            providerAccountId: profile.providerAccountId,
            email
          }
        }
      }
    })) as UserLike;

    return this.createSession(user);
  }


  async getCurrentUser(userId: string): Promise<AuthUserDto> {
    const user = (await this.prisma.user.findUnique({ where: { id: userId } })) as UserLike | null;
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return toAuthUserDto(user);
  }

  private async createSession(user: UserLike): Promise<AuthSessionDto> {
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email ?? undefined,
      role: user.role
    });
    const refresh = this.tokenService.createRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refresh.hash,
        expiresAt: refresh.expiresAt
      }
    });

    return {
      user: toAuthUserDto(user),
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.tokenService.accessTtlSeconds
    };
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toAuthUserDto(user: UserLike): AuthUserDto {
  return {
    id: user.id,
    email: user.email ?? undefined,
    displayName: user.displayName ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString(),
    createdAt: user.createdAt?.toISOString()
  };
}
