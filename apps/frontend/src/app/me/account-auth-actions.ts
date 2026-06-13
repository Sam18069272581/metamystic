import { buildGoogleAuthUrl } from "../../lib/public-url";

export interface AccountAuthAction {
  href: string;
  label: string;
  variant: "primary" | "secondary";
}

export interface AccountButtonAction {
  label: string;
  variant: "secondary";
}

export function getAccountAuthActions(apiBaseUrl: string): AccountAuthAction[] {
  return [
    { href: "/auth/login", label: "邮箱登录", variant: "primary" },
    { href: buildGoogleAuthUrl(apiBaseUrl), label: "Google 登录", variant: "secondary" }
  ];
}

export function getAccountLogoutAction(): AccountButtonAction {
  return {
    label: "退出登录",
    variant: "secondary"
  };
}
