export function buildBaziSharePath(chartId: string): string {
  return `/share/bazi/${encodeURIComponent(chartId)}`;
}

export function buildBaziShareUrl(origin: string, chartId: string): string {
  return new URL(buildBaziSharePath(chartId), origin).toString();
}
