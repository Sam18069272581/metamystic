import type {
  ApiResponse,
  AstrologyChartDto,
  AuthSessionDto,
  BaziChartDto,
  ConsultationDto,
  ConsultationHistoryDto,
  ConsultationListResponse,
  ConsultationStreamEvent,
  CompatibilityReadingDto,
  CompatibilityReadingListResponse,
  CreateBaziChartRequest,
  CreateAstrologyChartRequest,
  CreateCompatibilityRequest,
  CreateConsultationRequest,
  CreateUserProfileRequest,
  DailyFortuneDto,
  ProfileDto,
  ProfileMemorySignalsDto,
  PublicCompatibilityShareDto,
  LoginRequest,
  PublicBaziShareDto,
  RegisterRequest,
  UpsertProfileRequest,
  UpsertUserProfileRequest,
  UserChartArchiveDto,
  UserChartDetailDto,
  UserChartKind,
  UserProfileListResponse,
  CreateZiweiChartRequest,
  ZiweiChartDto
} from "@metamystic/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

async function request<T>(path: string, init: RequestInit, options: { retryAfterRefresh?: boolean } = {}): Promise<T> {
  const retryAfterRefresh = options.retryAfterRefresh ?? true;
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {})
      }
    });
  } catch (error) {
    throw new Error(
      error instanceof TypeError
        ? "\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef API\u3002\u8bf7\u786e\u8ba4 NestJS \u540e\u7aef\u5df2\u5728 4000 \u7aef\u53e3\u542f\u52a8\uff0c\u5e76\u4e14 PostgreSQL \u6570\u636e\u5e93\u53ef\u8fde\u63a5\u3002"
        : "\u7f51\u7edc\u8bf7\u6c42\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"
    );
  }

  const status = "ok" in response ? response.ok : true;
  if ("status" in response && response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers?.get?.("content-type") ?? "";
  const hasJsonBody = contentType.includes("application/json") || (!!response.json && contentType.length === 0);
  let payload: ApiResponse<T> | undefined;

  if (hasJsonBody) {
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new Error("\u65e0\u6cd5\u89e3\u6790\u540e\u7aef\u54cd\u5e94\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    }
  }

  if (!status) {
    const statusCode = "status" in response ? response.status : 500;
    if (statusCode === 401 && retryAfterRefresh && path !== "/auth/refresh") {
      await request<AuthSessionDto>("/auth/refresh", { method: "POST" }, { retryAfterRefresh: false });
      return request<T>(path, init, { retryAfterRefresh: false });
    }
    if (payload?.status === "error") {
      throw new Error(payload.error.message);
    }
    throw new Error(`\u540e\u7aef\u670d\u52a1\u6682\u65f6\u4e0d\u53ef\u7528\uff08HTTP ${statusCode}\uff09\u3002\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002`);
  }

  if (payload?.status === "error") {
    throw new Error(payload.error.message);
  }

  if (!payload || payload.status !== "success") {
    throw new Error("\u65e0\u6cd5\u89e3\u6790\u540e\u7aef\u54cd\u5e94\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
  }
  return payload.data;
}

export const apiClient = {
  register(input: RegisterRequest): Promise<AuthSessionDto> {
    return request<AuthSessionDto>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  login(input: LoginRequest): Promise<AuthSessionDto> {
    return request<AuthSessionDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  me() {
    return request<AuthSessionDto["user"]>("/auth/me", {
      method: "GET"
    });
  },

  logout(): Promise<void> {
    return request<void>("/auth/logout", {
      method: "POST"
    });
  },

  upsertProfile(input: UpsertProfileRequest): Promise<ProfileDto> {
    return request<ProfileDto>("/profiles", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  upsertMyProfile(input: UpsertUserProfileRequest): Promise<ProfileDto> {
    return request<ProfileDto>("/users/me/profile", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  listMyProfiles(): Promise<UserProfileListResponse> {
    return request<UserProfileListResponse>("/users/me/profiles", {
      method: "GET"
    });
  },

  createMyProfile(input: CreateUserProfileRequest): Promise<ProfileDto> {
    return request<ProfileDto>("/users/me/profiles", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  setDefaultMyProfile(profileId: string): Promise<ProfileDto> {
    return request<ProfileDto>(`/users/me/profiles/${encodeURIComponent(profileId)}/default`, {
      method: "PATCH"
    });
  },

  createMyCompatibilityReading(input: CreateCompatibilityRequest): Promise<CompatibilityReadingDto> {
    return request<CompatibilityReadingDto>("/users/me/compatibility", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  listMyCompatibilityReadings(): Promise<CompatibilityReadingListResponse> {
    return request<CompatibilityReadingListResponse>("/users/me/compatibility", {
      method: "GET"
    });
  },

  getMyCompatibilityReading(readingId: string): Promise<CompatibilityReadingDto> {
    return request<CompatibilityReadingDto>(`/users/me/compatibility/${encodeURIComponent(readingId)}`, {
      method: "GET"
    });
  },

  getPublicCompatibilityShare(readingId: string): Promise<PublicCompatibilityShareDto> {
    return request<PublicCompatibilityShareDto>(`/compatibility/${encodeURIComponent(readingId)}/share`, {
      method: "GET"
    });
  },

  createBaziChart(input: CreateBaziChartRequest): Promise<BaziChartDto> {
    return request<BaziChartDto>("/charts/bazi", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createMyBaziChart(input: CreateBaziChartRequest): Promise<BaziChartDto> {
    return request<BaziChartDto>("/users/me/charts/bazi", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createZiweiChart(input: CreateZiweiChartRequest): Promise<ZiweiChartDto> {
    return request<ZiweiChartDto>("/charts/ziwei", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createMyZiweiChart(input: CreateZiweiChartRequest): Promise<ZiweiChartDto> {
    return request<ZiweiChartDto>("/users/me/charts/ziwei", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createAstrologyChart(input: CreateAstrologyChartRequest): Promise<AstrologyChartDto> {
    return request<AstrologyChartDto>("/charts/astrology", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createMyAstrologyChart(input: CreateAstrologyChartRequest): Promise<AstrologyChartDto> {
    return request<AstrologyChartDto>("/users/me/charts/astrology", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  listMyCharts(): Promise<UserChartArchiveDto> {
    return request<UserChartArchiveDto>("/users/me/charts", {
      method: "GET"
    });
  },

  getTodayDailyFortune(): Promise<DailyFortuneDto> {
    return request<DailyFortuneDto>("/users/me/daily-fortune/today", {
      method: "GET"
    });
  },

  getMyChart(kind: UserChartKind, chartId: string): Promise<UserChartDetailDto> {
    return request<UserChartDetailDto>(`/users/me/charts/${kind}/${encodeURIComponent(chartId)}`, {
      method: "GET"
    });
  },

  getPublicBaziShareChart(chartId: string): Promise<PublicBaziShareDto> {
    return request<PublicBaziShareDto>(`/charts/bazi/${encodeURIComponent(chartId)}/share`, {
      method: "GET"
    });
  },

  createConsultation(input: CreateConsultationRequest): Promise<ConsultationDto> {
    return request<ConsultationDto>("/consultations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  createMyConsultation(input: CreateConsultationRequest): Promise<ConsultationDto> {
    return request<ConsultationDto>("/users/me/consultations", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  getConsultationHistory(consultationId: string, anonymousUserId: string): Promise<ConsultationHistoryDto> {
    return request<ConsultationHistoryDto>(
      `/consultations/${encodeURIComponent(consultationId)}?anonymousUserId=${encodeURIComponent(anonymousUserId)}`,
      {
      method: "GET"
      }
    );
  },

  getMyConsultationHistory(consultationId: string): Promise<ConsultationHistoryDto> {
    return request<ConsultationHistoryDto>(`/users/me/consultations/${consultationId}`, {
      method: "GET"
    });
  },

  getProfileMemory(profileId: string, anonymousUserId: string): Promise<ProfileMemorySignalsDto> {
    return request<ProfileMemorySignalsDto>(
      `/profiles/${encodeURIComponent(profileId)}/memory?anonymousUserId=${encodeURIComponent(anonymousUserId)}`,
      {
        method: "GET"
      }
    );
  },

  getMyProfileMemory(profileId: string): Promise<ProfileMemorySignalsDto> {
    return request<ProfileMemorySignalsDto>(`/users/me/profiles/${encodeURIComponent(profileId)}/memory`, {
      method: "GET"
    });
  },

  listProfileConsultations(profileId: string): Promise<ConsultationListResponse> {
    return request<ConsultationListResponse>(`/consultations?profileId=${encodeURIComponent(profileId)}`, {
      method: "GET"
    });
  },

  listMyProfileConsultations(profileId: string): Promise<ConsultationListResponse> {
    return request<ConsultationListResponse>(`/users/me/consultations?profileId=${encodeURIComponent(profileId)}`, {
      method: "GET"
    });
  },

  streamConsultation(
    consultationId: string,
    anonymousUserId: string,
    onEvent: (event: ConsultationStreamEvent) => void,
    onError: (message: string) => void
  ): () => void {
    return openConsultationStream(
      `/consultations/${encodeURIComponent(consultationId)}/stream?anonymousUserId=${encodeURIComponent(anonymousUserId)}`,
      onEvent,
      onError
    );
  },

  streamMyConsultation(
    consultationId: string,
    onEvent: (event: ConsultationStreamEvent) => void,
    onError: (message: string) => void
  ): () => void {
    return openConsultationStream(
      `/users/me/consultations/${encodeURIComponent(consultationId)}/stream`,
      onEvent,
      onError,
      { withCredentials: true }
    );
  }
};

function openConsultationStream(
  path: string,
  onEvent: (event: ConsultationStreamEvent) => void,
  onError: (message: string) => void,
  init?: EventSourceInit
): () => void {
  const url = `${API_BASE_URL}${path}`;
  const source = init ? new EventSource(url, init) : new EventSource(url);
  let closedByClient = false;
  source.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as ConsultationStreamEvent;
      onEvent(event);
      if (event.type === "done" || event.type === "error") {
        closedByClient = true;
        source.close();
      }
    } catch {
      onError("\u65e0\u6cd5\u89e3\u6790 AI \u6d41\u5f0f\u54cd\u5e94\u3002");
    }
  };
  source.onerror = () => {
    if (closedByClient || source.readyState === EventSource.CLOSED) {
      return;
    }
    onError("AI \u6d41\u5f0f\u8fde\u63a5\u4e2d\u65ad\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    source.close();
  };
  return () => {
    closedByClient = true;
    source.close();
  };
}
