const STORAGE_KEY = "metamystic.anonymousUserId";

interface AnonymousUserIdDependencies {
  localStorage?: Pick<Storage, "getItem" | "setItem">;
  randomUUID?: () => string;
}

export function getOrCreateAnonymousUserId(dependencies: AnonymousUserIdDependencies = {}): string {
  const storage = dependencies.localStorage ?? globalThis.localStorage;
  const existing = storage.getItem(STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const randomUUID = dependencies.randomUUID ?? globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
  const randomPart = (randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/[^a-zA-Z0-9]/g, "");
  const anonymousUserId = `anon-${randomPart}`;
  storage.setItem(STORAGE_KEY, anonymousUserId);
  return anonymousUserId;
}
