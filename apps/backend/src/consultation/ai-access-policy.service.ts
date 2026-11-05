import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AiAccessDto } from "@metamystic/shared";
import type { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

type AiAccessOwnerType = "anonymous" | "user";
type UsageClient = PrismaService | Prisma.TransactionClient;

const ANONYMOUS_GLOBAL_SUBJECT = "global:anonymous";
const ANONYMOUS_GLOBAL_EXHAUSTED_MESSAGE = "今日匿名公测额度已满，登录后可继续使用。";

export interface AiAccessInput {
  userId: string;
  ownerType: AiAccessOwnerType;
  now?: Date;
}

interface UsageRow {
  used: number;
}

export class AiAccessPolicyError extends Error {
  constructor(
    readonly code: "AI_RATE_LIMITED" | "AI_PLAN_REQUIRED",
    message: string,
    readonly resetsAt?: string
  ) {
    super(message);
    this.name = "AiAccessPolicyError";
  }

  toHttpException(): HttpException {
    return new HttpException(
      {
        code: this.code,
        message: this.message,
        details: this.resetsAt ? { resetsAt: this.resetsAt } : {}
      },
      this.code === "AI_RATE_LIMITED" ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.PAYMENT_REQUIRED
    );
  }
}

@Injectable()
export class AiAccessPolicyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async preview(input: AiAccessInput): Promise<AiAccessDto> {
    this.assertPublicBetaMode();
    const now = input.now ?? new Date();
    const dayStart = startOfUtcDay(now);
    const resetsAt = addMilliseconds(dayStart, 86_400_000).toISOString();
    let remaining = this.dailyLimit(input.ownerType) - await this.readDailyUsed(input.userId, dayStart);
    if (input.ownerType === "anonymous") {
      const globalRemaining = this.anonymousGlobalDailyLimit() - await this.readDailyUsed(ANONYMOUS_GLOBAL_SUBJECT, dayStart);
      remaining = Math.min(remaining, globalRemaining);
    }
    return publicBetaAccess(Math.max(0, remaining), resetsAt);
  }

  private async readDailyUsed(subject: string, dayStart: Date): Promise<number> {
    const rows = await this.prisma.$queryRaw<UsageRow[]>`
      SELECT used
      FROM "AiUsageBucket"
      WHERE subject = ${subject}
        AND feature = 'consultation'
        AND "windowType" = 'day'
        AND "windowStart" = ${dayStart}
      LIMIT 1
    `;
    return Number(rows.at(0)?.used ?? 0);
  }

  async assertAvailable(input: AiAccessInput): Promise<AiAccessDto> {
    const access = await this.preview(input);
    if (access.remaining <= 0) {
      throw new AiAccessPolicyError(
        "AI_RATE_LIMITED",
        "公测额度已用完，请在额度重置后再试。",
        access.resetsAt
      ).toHttpException();
    }
    return access;
  }

  async consume(input: AiAccessInput): Promise<AiAccessDto> {
    this.assertPublicBetaMode();
    const now = input.now ?? new Date();
    const dayStart = startOfUtcDay(now);
    const minuteStart = startOfUtcMinute(now);
    const resetsAt = addMilliseconds(dayStart, 86_400_000).toISOString();
    const dailyLimit = this.dailyLimit(input.ownerType);
    const minuteLimit = positiveInteger(this.config.get<string>("AI_PUBLIC_BETA_REQUESTS_PER_MINUTE"), 3);

    const dailyUsed = await this.prisma.$transaction(async (tx) => {
      const day = await this.incrementBucket(tx, input.userId, "day", dayStart, dailyLimit);
      if (day === undefined) {
        throw new AiAccessPolicyError("AI_RATE_LIMITED", "公测额度已用完，请在额度重置后再试。", resetsAt);
      }
      const minute = await this.incrementBucket(tx, input.userId, "minute", minuteStart, minuteLimit);
      if (minute === undefined) {
        throw new AiAccessPolicyError(
          "AI_RATE_LIMITED",
          "请求过于频繁，请稍候一分钟再试。",
          addMilliseconds(minuteStart, 60_000).toISOString()
        );
      }
      // Anonymous ids are client-generated, so per-id limits alone are bypassable; this caps all anonymous usage.
      if (input.ownerType === "anonymous") {
        const global = await this.incrementBucket(
          tx,
          ANONYMOUS_GLOBAL_SUBJECT,
          "day",
          dayStart,
          this.anonymousGlobalDailyLimit()
        );
        if (global === undefined) {
          throw new AiAccessPolicyError("AI_RATE_LIMITED", ANONYMOUS_GLOBAL_EXHAUSTED_MESSAGE, resetsAt);
        }
      }
      return day;
    });

    return publicBetaAccess(Math.max(0, dailyLimit - dailyUsed), resetsAt);
  }

  private assertPublicBetaMode(): void {
    const mode = (this.config.get<string>("AI_ACCESS_MODE") ?? "public_beta").toLowerCase();
    if (mode !== "public_beta") {
      throw new AiAccessPolicyError("AI_PLAN_REQUIRED", "当前 AI 访问模式需要有效套餐。");
    }
  }

  private dailyLimit(ownerType: AiAccessOwnerType): number {
    return ownerType === "anonymous"
      ? positiveInteger(this.config.get<string>("AI_PUBLIC_BETA_ANON_DAILY_LIMIT"), 5)
      : positiveInteger(this.config.get<string>("AI_PUBLIC_BETA_USER_DAILY_LIMIT"), 30);
  }

  private anonymousGlobalDailyLimit(): number {
    return positiveInteger(this.config.get<string>("AI_PUBLIC_BETA_ANON_GLOBAL_DAILY_LIMIT"), 200);
  }

  private async incrementBucket(
    client: UsageClient,
    subject: string,
    windowType: "day" | "minute",
    windowStart: Date,
    limit: number
  ): Promise<number | undefined> {
    const rows = await client.$queryRaw<UsageRow[]>`
      INSERT INTO "AiUsageBucket" (
        id, subject, feature, "windowType", "windowStart", used, "updatedAt"
      )
      VALUES (${randomUUID()}, ${subject}, 'consultation', ${windowType}, ${windowStart}, 1, NOW())
      ON CONFLICT (subject, feature, "windowType", "windowStart")
      DO UPDATE SET used = "AiUsageBucket".used + 1, "updatedAt" = NOW()
      WHERE "AiUsageBucket".used < ${limit}
      RETURNING used
    `;
    const used = rows.at(0)?.used;
    return used === undefined ? undefined : Number(used);
  }
}

function publicBetaAccess(remaining: number, resetsAt: string): AiAccessDto {
  return { mode: "public_beta", charged: false, remaining, resetsAt };
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = value ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcMinute(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes()
  ));
}

function addMilliseconds(date: Date, milliseconds: number): Date {
  return new Date(date.getTime() + milliseconds);
}
