import type { UserChartArchiveDto, UserChartKind } from "@metamystic/shared";

type AccountChartAction =
  | { action: "view"; href: string; label: string }
  | { action: "create"; label: string; profileId: string }
  | { action: "disabled"; label: string };

const labels: Record<UserChartKind, { create: string; view: string }> = {
  bazi: { create: "生成八字", view: "查看八字" },
  ziwei: { create: "生成紫微", view: "查看紫微" },
  astrology: { create: "生成星盘", view: "查看星盘" }
};

export function buildAccountChartAction({
  archive,
  kind
}: {
  archive: UserChartArchiveDto | undefined;
  kind: UserChartKind;
}): AccountChartAction {
  const chart = firstChart(archive, kind);
  if (chart) {
    return {
      action: "view",
      href: `/me/charts/${kind}/${encodeURIComponent(chart.id)}`,
      label: labels[kind].view
    };
  }

  if (archive?.profile?.id) {
    return {
      action: "create",
      label: labels[kind].create,
      profileId: archive.profile.id
    };
  }

  return {
    action: "disabled",
    label: "先建档案"
  };
}

function firstChart(archive: UserChartArchiveDto | undefined, kind: UserChartKind): { id: string } | undefined {
  if (kind === "bazi") {
    return archive?.baziCharts[0];
  }
  if (kind === "ziwei") {
    return archive?.ziweiCharts[0];
  }
  return archive?.astrologyCharts[0];
}
