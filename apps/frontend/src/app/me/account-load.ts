import type {
  AuthUserDto,
  CompatibilityReadingDto,
  CompatibilityReadingListResponse,
  UserChartArchiveDto,
  UserProfileListResponse
} from "@metamystic/shared";

interface AccountApi {
  me: () => Promise<AuthUserDto>;
  listMyCharts: () => Promise<UserChartArchiveDto>;
  listMyProfiles: () => Promise<UserProfileListResponse>;
  listMyCompatibilityReadings: () => Promise<CompatibilityReadingListResponse>;
}

export interface AccountLoadResult {
  archive: UserChartArchiveDto | undefined;
  compatibilityHistory: CompatibilityReadingDto[];
  error: string | undefined;
  profiles: UserProfileListResponse | undefined;
  user: AuthUserDto;
}

export async function loadAccountData(api: AccountApi): Promise<AccountLoadResult> {
  const user = await api.me();
  const [archiveResult, profilesResult, compatibilityResult] = await Promise.allSettled([
    api.listMyCharts(),
    api.listMyProfiles(),
    api.listMyCompatibilityReadings()
  ]);
  const errors = [archiveResult, profilesResult, compatibilityResult]
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => (result.reason instanceof Error ? result.reason.message : String(result.reason)));

  return {
    archive: archiveResult.status === "fulfilled" ? archiveResult.value : undefined,
    compatibilityHistory: compatibilityResult.status === "fulfilled" ? compatibilityResult.value.readings : [],
    error: errors.length > 0 ? errors.join("；") : undefined,
    profiles: profilesResult.status === "fulfilled" ? profilesResult.value : undefined,
    user
  };
}
