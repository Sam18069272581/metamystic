import type { InputJsonObject, InputJsonValue } from "@prisma/client/runtime/library";

export type PrismaJsonObject = InputJsonObject;
export type PrismaJsonValue = InputJsonValue;

export function asPrismaJson(value: unknown): PrismaJsonValue {
  return value as PrismaJsonValue;
}
