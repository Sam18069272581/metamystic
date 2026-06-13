import type { AuthUserDto, UserChartArchiveDto, UserProfileListResponse } from "@metamystic/shared";

export type AccountNextStepKind = "loading" | "anonymous" | "needs_profile" | "needs_bazi" | "ready";

export interface AccountNextStep {
  kind: AccountNextStepKind;
  title: string;
  description: string;
  primaryLabel: string;
  primaryHref?: string | undefined;
  secondaryLabel?: string | undefined;
  secondaryHref?: string | undefined;
  statusLabel: string;
}

export function buildAccountNextStep({
  archive,
  loading,
  profiles,
  user
}: {
  archive?: UserChartArchiveDto | undefined;
  loading: boolean;
  profiles?: UserProfileListResponse | undefined;
  user?: AuthUserDto | undefined;
}): AccountNextStep {
  if (loading) {
    return {
      kind: "loading",
      title: "正在同步登录状态",
      description: "正在读取你的账户、档案和命盘数据。",
      primaryLabel: "同步中",
      primaryHref: undefined,
      statusLabel: "连接账户"
    };
  }

  if (!user) {
    return {
      kind: "anonymous",
      title: "登录后保存你的命盘",
      description: "登录后可以保存出生档案、历史命盘、AI 分析和长期记忆。",
      primaryLabel: "去登录",
      primaryHref: "/auth/login",
      statusLabel: "未登录"
    };
  }

  const baziChart = archive?.baziCharts[0];
  if (baziChart) {
    const query = new URLSearchParams({
      profileId: baziChart.profileId,
      chartId: baziChart.id
    });
    return {
      kind: "ready",
      title: "可以开始 AI 命理分析",
      description: `${baziChart.mainPattern} · 日主${baziChart.dayMaster}${strengthText(baziChart.dayMasterStatus)}，可直接进入分析。`,
      primaryLabel: "开始 AI 命理分析",
      primaryHref: `/consult?${query.toString()}`,
      secondaryLabel: "查看命盘详情",
      secondaryHref: `/me/charts/bazi/${encodeURIComponent(baziChart.id)}`,
      statusLabel: "命盘已就绪"
    };
  }

  const hasProfile = Boolean(archive?.profile) || Boolean(profiles?.profiles.length);
  if (!hasProfile) {
    return {
      kind: "needs_profile",
      title: "先建立出生档案",
      description: "填写出生年月日时后，才能稳定生成八字、紫微、星盘和每日签语。",
      primaryLabel: "填写出生信息",
      primaryHref: "#profile-form",
      statusLabel: "已登录"
    };
  }

  return {
    kind: "needs_bazi",
    title: "生成第一张八字命盘",
    description: "先完成四柱排盘，再进入 AI 命理分析，结果会更具体。",
    primaryLabel: "生成八字命盘",
    primaryHref: "/charts/bazi",
    statusLabel: "档案已建立"
  };
}

function strengthText(status: "strong" | "balanced" | "weak"): string {
  return {
    strong: "偏强",
    balanced: "中和",
    weak: "偏弱"
  }[status];
}
