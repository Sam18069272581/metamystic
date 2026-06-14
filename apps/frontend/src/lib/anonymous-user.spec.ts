import { describe, expect, it, vi } from "vitest";
import { getOrCreateAnonymousUserId } from "./anonymous-user";

describe("anonymous user id", () => {
  it("creates and persists a browser-scoped anonymous user id", () => {
    const storage = new Map<string, string>();
    const localStorage = {
      getItem: vi.fn((key: string) => storage.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storage.set(key, value))
    };
    const randomUUID = vi.fn(() => "12345678-1234-4234-9234-123456789abc");

    const first = getOrCreateAnonymousUserId({ localStorage, randomUUID });
    const second = getOrCreateAnonymousUserId({ localStorage, randomUUID });

    expect(first).toBe("anon-12345678123442349234123456789abc");
    expect(second).toBe(first);
    expect(randomUUID).toHaveBeenCalledTimes(1);
    expect(first).not.toBe("local-demo-user");
  });
});
