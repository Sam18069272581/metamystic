export interface AccountAuthStatus {
  tone: "success" | "warning";
  title: string;
  description: string;
}

const successDescription = "账号状态已刷新，命盘、咨询记录和个人档案会保存到当前账户。";
const warningStatus: AccountAuthStatus = {
  tone: "warning",
  title: "登录回调已返回，但会话未生效",
  description: "页面没有读取到有效登录态。请重新登录；如果仍失败，需要检查生产域名、OAuth redirect URI 和 Cookie 配置。"
};

export function getAccountAuthStatus(authSource: string | null, authenticated: boolean): AccountAuthStatus | undefined {
  if (authSource !== "google" && authSource !== "email") {
    return undefined;
  }

  if (!authenticated) {
    return warningStatus;
  }

  if (authSource === "google") {
    return {
      tone: "success",
      title: "已通过 Google 登录",
      description: successDescription
    };
  }

  return {
    tone: "success",
    title: "已登录",
    description: successDescription
  };
}
