import { describe, expect, it } from "vitest";
import { getAccountAuthStatus } from "./account-auth-status";

describe("account auth status", () => {
  it("shows a Google login success message when redirected from OAuth", () => {
    expect(getAccountAuthStatus("google", true)).toEqual({
      tone: "success",
      title: "已通过 Google 登录",
      description: "账号状态已刷新，命盘、咨询记录和个人档案会保存到当前账户。"
    });
  });

  it("shows an email login success message when redirected from email auth", () => {
    expect(getAccountAuthStatus("email", true)).toEqual({
      tone: "success",
      title: "已登录",
      description: "账号状态已刷新，命盘、咨询记录和个人档案会保存到当前账户。"
    });
  });

  it("shows a clear warning when the auth callback returns but the session is not verified", () => {
    expect(getAccountAuthStatus("google", false)).toEqual({
      tone: "warning",
      title: "登录回调已返回，但会话未生效",
      description: "页面没有读取到有效登录态。请重新登录；如果仍失败，需要检查生产域名、OAuth redirect URI 和 Cookie 配置。"
    });
  });

  it("does not show an auth status message without a supported marker", () => {
    expect(getAccountAuthStatus(null, false)).toBeUndefined();
    expect(getAccountAuthStatus("unknown", false)).toBeUndefined();
  });
});
