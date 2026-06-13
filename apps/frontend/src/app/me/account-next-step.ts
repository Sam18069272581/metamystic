import type { AuthUserDto, UserChartArchiveDto, UserProfileListResponse } from "@metamystic/shared";

export type AccountNextStepKind = "loading" | "anonymous" | "needs_profile" | "needs_bazi" | "ready";
export type AccountNextStepAction = "disabled" | "link" | "create_bazi";

export interface AccountNextStep {
  kind: AccountNextStepKind;
  title: string;
  description: string;
  primaryLabel: string;
  primaryAction: AccountNextStepAction;
  primaryHref?: string | undefined;
  profileId?: string | undefined;
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
      title: "\u6b63\u5728\u540c\u6b65\u767b\u5f55\u72b6\u6001",
      description: "\u6b63\u5728\u8bfb\u53d6\u4f60\u7684\u8d26\u6237\u3001\u6863\u6848\u548c\u547d\u76d8\u6570\u636e\u3002",
      primaryLabel: "\u540c\u6b65\u4e2d",
      primaryAction: "disabled",
      primaryHref: undefined,
      statusLabel: "\u8fde\u63a5\u8d26\u6237"
    };
  }

  if (!user) {
    return {
      kind: "anonymous",
      title: "\u767b\u5f55\u540e\u4fdd\u5b58\u4f60\u7684\u547d\u76d8",
      description: "\u767b\u5f55\u540e\u53ef\u4ee5\u4fdd\u5b58\u51fa\u751f\u6863\u6848\u3001\u5386\u53f2\u547d\u76d8\u3001AI \u5206\u6790\u548c\u957f\u671f\u8bb0\u5fc6\u3002",
      primaryLabel: "\u53bb\u767b\u5f55",
      primaryAction: "link",
      primaryHref: "/auth/login",
      statusLabel: "\u672a\u767b\u5f55"
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
      title: "\u53ef\u4ee5\u5f00\u59cb AI \u547d\u7406\u5206\u6790",
      description: `${baziChart.mainPattern} \u00b7 \u65e5\u4e3b${baziChart.dayMaster}${strengthText(baziChart.dayMasterStatus)}\uff0c\u53ef\u76f4\u63a5\u8fdb\u5165\u5206\u6790\u3002`,
      primaryLabel: "\u5f00\u59cb AI \u547d\u7406\u5206\u6790",
      primaryAction: "link",
      primaryHref: `/consult?${query.toString()}`,
      secondaryLabel: "\u67e5\u770b\u547d\u76d8\u8be6\u60c5",
      secondaryHref: `/me/charts/bazi/${encodeURIComponent(baziChart.id)}`,
      statusLabel: "\u547d\u76d8\u5df2\u5c31\u7eea"
    };
  }

  const profileId = resolveProfileId(archive, profiles);
  if (!profileId) {
    return {
      kind: "needs_profile",
      title: "\u5148\u5efa\u7acb\u51fa\u751f\u6863\u6848",
      description: "\u586b\u5199\u51fa\u751f\u5e74\u6708\u65e5\u65f6\u540e\uff0c\u624d\u80fd\u7a33\u5b9a\u751f\u6210\u516b\u5b57\u3001\u7d2b\u5fae\u3001\u661f\u76d8\u548c\u6bcf\u65e5\u7b7e\u8bed\u3002",
      primaryLabel: "\u586b\u5199\u51fa\u751f\u4fe1\u606f",
      primaryAction: "link",
      primaryHref: "#profile-form",
      statusLabel: "\u5df2\u767b\u5f55"
    };
  }

  return {
    kind: "needs_bazi",
    title: "\u751f\u6210\u7b2c\u4e00\u5f20\u516b\u5b57\u547d\u76d8",
    description: "\u4f7f\u7528\u5df2\u4fdd\u5b58\u7684\u51fa\u751f\u6863\u6848\u76f4\u63a5\u751f\u6210\u56db\u67f1\uff0c\u7136\u540e\u8fdb\u5165 AI \u547d\u7406\u5206\u6790\u3002",
    primaryLabel: "\u4e00\u952e\u751f\u6210\u516b\u5b57",
    primaryAction: "create_bazi",
    profileId,
    statusLabel: "\u6863\u6848\u5df2\u5efa\u7acb"
  };
}

function resolveProfileId(
  archive: UserChartArchiveDto | undefined,
  profiles: UserProfileListResponse | undefined
): string | undefined {
  if (profiles?.defaultProfileId) {
    return profiles.defaultProfileId;
  }
  return archive?.profile?.id ?? profiles?.profiles[0]?.id;
}

function strengthText(status: "strong" | "balanced" | "weak"): string {
  return {
    strong: "\u504f\u5f3a",
    balanced: "\u4e2d\u548c",
    weak: "\u504f\u5f31"
  }[status];
}
