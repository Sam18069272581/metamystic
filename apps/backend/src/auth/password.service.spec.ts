import { describe, expect, it } from "vitest";
import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  it("hashes and verifies passwords without storing plaintext", async () => {
    const service = new PasswordService();

    const hash = await service.hash("Correct Horse Battery Staple 42!");

    expect(hash).not.toContain("Correct Horse");
    await expect(service.verify("Correct Horse Battery Staple 42!", hash)).resolves.toBe(true);
    await expect(service.verify("wrong-password", hash)).resolves.toBe(false);
  });
});
