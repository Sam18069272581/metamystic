import type { ApiSuccess } from "@metamystic/shared";

export function ok<T>(data: T): ApiSuccess<T> {
  return { status: "success", data };
}
