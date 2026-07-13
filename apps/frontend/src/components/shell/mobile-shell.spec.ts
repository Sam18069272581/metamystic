import { describe, expect, it } from "vitest";
import { getMobileShellNavItems, mobileShellStatusLabel } from "./mobile-shell-nav";

describe("mobile shell navigation", () => {
  it("localizes Chinese navigation labels and links", () => {
    expect(getMobileShellNavItems("zh")).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/zh/me", label: "我的" })])
    );
  });

  it("localizes English navigation labels and links", () => {
    expect(getMobileShellNavItems("en")).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: "/en/me", label: "Me" })])
    );
  });
});

describe("MobileShell header", () => {
  it("renders an accessible status icon instead of a literal unicode escape", () => {
    expect(mobileShellStatusLabel).toBe("夜间模式");
    expect(mobileShellStatusLabel).not.toContain("\\u");
  });
});
