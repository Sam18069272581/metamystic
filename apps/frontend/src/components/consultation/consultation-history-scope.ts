export type ConsultationHistoryScope = "public" | "user";

export function getConsultationHistoryScope({
  hasUser,
  usingSavedChart
}: {
  hasUser: boolean;
  usingSavedChart: boolean;
}): ConsultationHistoryScope {
  return hasUser || usingSavedChart ? "user" : "public";
}
