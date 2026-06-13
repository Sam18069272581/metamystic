import { describe, expect, it } from "vitest";
import { mobileShellNavItems } from "./mobile-shell-nav";

describe("mobile shell navigation", () => {
  it("links the account tab to the account page", () => {
    expect(mobileShellNavItems.find((item) => item.label === "我的")?.href).toBe("/me");
  });
});
