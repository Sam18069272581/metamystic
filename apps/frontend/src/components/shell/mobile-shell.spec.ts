import { describe, expect, it } from "vitest";
import { mobileShellNavItems, mobileShellStatusLabel } from "./mobile-shell-nav";

describe("mobile shell navigation", () => {
  it("links the account tab to the account page", () => {
    expect(mobileShellNavItems.find((item) => item.label === "我的")?.href).toBe("/me");
  });
});

describe("MobileShell header", () => {
  it("renders an accessible status icon instead of a literal unicode escape", () => {
    expect(mobileShellStatusLabel).toBe("夜间模式");
    expect(mobileShellStatusLabel).not.toContain("\\u");
  });
});
