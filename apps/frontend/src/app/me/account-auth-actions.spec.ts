import { describe, expect, it } from "vitest";
import { getAccountAuthActions, getAccountLogoutAction } from "./account-auth-actions";

describe("account auth actions", () => {
  it("offers email and Google login links for anonymous users", () => {
    const actions = getAccountAuthActions("https://api.metamystic.app/api/v1");

    expect(actions).toEqual([
      { href: "/auth/login", label: "邮箱登录", variant: "primary" },
      { href: "https://api.metamystic.app/api/v1/auth/google", label: "Google 登录", variant: "secondary" }
    ]);
  });

  it("offers a clear logout action for authenticated users", () => {
    expect(getAccountLogoutAction()).toEqual({
      label: "退出登录",
      variant: "secondary"
    });
  });
});
