import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client";

const compatibilityReading = {
  id: "compat-1",
  profiles: {
    a: { id: "profile-1", label: "自己" },
    b: { id: "profile-2", label: "伴侣" }
  },
  charts: {
    a: { id: "bazi-1", profileId: "profile-1", dayMaster: "乙", dayMasterStatus: "weak", mainPattern: "杀印相生" },
    b: { id: "bazi-2", profileId: "profile-2", dayMaster: "壬", dayMasterStatus: "strong", mainPattern: "食神生财" }
  },
  overallScore: 76,
  level: "good",
  dimensions: {
    fiveElement: { score: 78, summary: "五行互补明显", items: [] },
    stems: { score: 70, summary: "天干互动偏合", items: [] },
    branches: { score: 68, summary: "地支关系平衡", items: [] },
    dayMasters: { score: 74, summary: "日主关系有扶持感", items: [] }
  },
  advantages: ["五行互补明显"],
  risks: ["需要同步节奏"],
  advice: ["先尊重彼此决策方式"],
  disclaimer: "合盘用于关系模式观察",
  createdAt: "2026-06-05T00:00:00.000Z"
};

const publicCompatibilityShare = {
  ...compatibilityReading,
  profiles: {
    a: { label: "自己" },
    b: { label: "伴侣" }
  },
  charts: {
    a: { dayMaster: "乙", dayMasterStatus: "weak", mainPattern: "杀印相生" },
    b: { dayMaster: "壬", dayMasterStatus: "strong", mainPattern: "食神生财" }
  }
};

const dailyFortune = {
  date: "2026-06-12",
  status: "ready",
  profile: { id: "profile-1", label: "自己" },
  score: 82,
  element: "water",
  title: "水气得用，适合顺势推进",
  summary: "今日水气被激活。",
  advice: ["收集信息再决策"],
  cautions: ["避免情绪高点做最终决定"],
  luckyActions: ["适合学习、研究和深谈"],
  source: {
    chartId: "bazi-1",
    dayMaster: "乙",
    dayMasterStatus: "weak",
    mainPattern: "杀印相生",
    usefulGods: ["water"]
  }
};

function mockSuccess<T>(data: T): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: async () => ({
        status: "success",
        data
      })
    })
  );
}

function jsonResponse<T>(payload: T, init: { ok: boolean; status: number }) {
  return {
    ok: init.ok,
    status: init.status,
    headers: {
      get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : "")
    },
    json: async () => payload
  };
}

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses readable Chinese messages for network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));

    await expect(apiClient.getConsultationHistory("consult-1", "anon-1")).rejects.toThrow("无法连接后端 API");
  });

  it("registers with email auth", async () => {
    mockSuccess({
      user: { id: "user-1", email: "user@example.com", role: "USER" },
      accessToken: "access.jwt",
      refreshToken: "refresh-token",
      expiresIn: 900
    });

    const session = await apiClient.register({
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
      displayName: "小玄"
    });

    expect(session.user.email).toBe("user@example.com");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/register",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("refreshes an expired access cookie and retries current-user requests", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: "error",
            error: { message: "Authentication required" }
          },
          { ok: false, status: 401 }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: "success",
            data: {
              user: { id: "user-1", email: "user@example.com", role: "USER" },
              accessToken: "fresh-access.jwt",
              refreshToken: "fresh-refresh",
              expiresIn: 900
            }
          },
          { ok: true, status: 201 }
        )
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            status: "success",
            data: { id: "user-1", email: "user@example.com", role: "USER" }
          },
          { ok: true, status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const user = await apiClient.me();

    expect(user.email).toBe("user@example.com");
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:4000/api/v1/auth/me",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:4000/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:4000/api/v1/auth/me",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches anonymous profile memory signals with the browser anonymous user id", async () => {
    mockSuccess({
      decisionTopics: ["海外发展"],
      riskStyle: "稳健试探",
      preferredTone: "理性策略",
      sources: ["consult-1"]
    });

    const memory = await apiClient.getProfileMemory("profile-1", "anon-1");

    expect(memory.decisionTopics).toEqual(["海外发展"]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/profiles/profile-1/memory?anonymousUserId=anon-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("fetches current-user profile memory through authenticated APIs", async () => {
    mockSuccess({
      decisionTopics: ["career"],
      riskStyle: "steady",
      preferredTone: "strategic",
      sources: ["consult-2"]
    });

    const memory = await apiClient.getMyProfileMemory("profile-1");

    expect(memory.sources).toEqual(["consult-2"]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/profiles/profile-1/memory",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("creates the current user's profile through authenticated APIs", async () => {
    mockSuccess({
      id: "profile-1",
      anonymousUserId: "",
      birthTime: "1995-05-20T10:30:00.000Z",
      birthTimezone: "Europe/Berlin",
      gender: "female",
      createdAt: "2026-05-30T00:00:00.000Z",
      updatedAt: "2026-05-30T00:00:00.000Z"
    });

    const profile = await apiClient.upsertMyProfile({
      birthTime: "1995-05-20T10:30:00.000Z",
      birthTimezone: "Europe/Berlin",
      gender: "female"
    });

    expect(profile.id).toBe("profile-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/profile",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("lists the current user's birth profiles", async () => {
    mockSuccess({
      defaultProfileId: "profile-1",
      profiles: [
        {
          id: "profile-1",
          anonymousUserId: "",
          label: "自己",
          isDefault: true,
          displayName: "Self",
          birthTime: "1995-05-20T10:30:00.000Z",
          birthTimezone: "Europe/Berlin",
          gender: "female",
          createdAt: "2026-05-30T00:00:00.000Z",
          updatedAt: "2026-05-30T00:00:00.000Z"
        }
      ]
    });

    const response = await apiClient.listMyProfiles();

    expect(response.defaultProfileId).toBe("profile-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/profiles",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("creates a current-user birth profile", async () => {
    mockSuccess({
      id: "profile-2",
      anonymousUserId: "",
      label: "伴侣",
      isDefault: false,
      birthTime: "1992-08-01T02:00:00.000Z",
      birthTimezone: "Asia/Shanghai",
      gender: "male",
      createdAt: "2026-05-30T00:00:00.000Z",
      updatedAt: "2026-05-30T00:00:00.000Z"
    });

    const profile = await apiClient.createMyProfile({
      label: "伴侣",
      birthTime: "1992-08-01T02:00:00.000Z",
      birthTimezone: "Asia/Shanghai",
      gender: "male"
    });

    expect(profile.id).toBe("profile-2");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/profiles",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("sets the current user's default birth profile", async () => {
    mockSuccess({
      id: "profile-2",
      anonymousUserId: "",
      label: "伴侣",
      isDefault: true,
      birthTime: "1992-08-01T02:00:00.000Z",
      birthTimezone: "Asia/Shanghai",
      gender: "male",
      createdAt: "2026-05-30T00:00:00.000Z",
      updatedAt: "2026-05-30T00:00:00.000Z"
    });

    const profile = await apiClient.setDefaultMyProfile("profile-2");

    expect(profile.isDefault).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/profiles/profile-2/default",
      expect.objectContaining({ method: "PATCH", credentials: "include" })
    );
  });

  it("lists the current user's chart archive", async () => {
    mockSuccess({
      profile: undefined,
      baziCharts: [],
      ziweiCharts: [],
      astrologyCharts: []
    });

    const archive = await apiClient.listMyCharts();

    expect(archive.baziCharts).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/charts",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches today's daily fortune for the current user", async () => {
    mockSuccess(dailyFortune);

    const fortune = await apiClient.getTodayDailyFortune();

    expect(fortune.score).toBe(82);
    expect(fortune.status).toBe("ready");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/daily-fortune/today",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches one current-user chart detail", async () => {
    mockSuccess({
      kind: "ziwei",
      chart: {
        id: "ziwei-1",
        profileId: "profile-1",
        lifePalace: "life",
        bodyPalace: "career",
        palaces: [],
        summary: "紫微盘",
        createdAt: "2026-06-02T00:00:00.000Z"
      }
    });

    const detail = await apiClient.getMyChart("ziwei", "ziwei-1");

    expect(detail.kind).toBe("ziwei");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/charts/ziwei/ziwei-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("creates a current-user compatibility reading", async () => {
    mockSuccess(compatibilityReading);

    const reading = await apiClient.createMyCompatibilityReading({
      profileAId: "profile-1",
      profileBId: "profile-2"
    });

    expect(reading.id).toBe("compat-1");
    expect(reading.overallScore).toBe(76);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/compatibility",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("lists current-user compatibility readings", async () => {
    mockSuccess({ readings: [compatibilityReading] });

    const response = await apiClient.listMyCompatibilityReadings();

    expect(response.readings[0]?.id).toBe("compat-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/compatibility",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches one current-user compatibility reading", async () => {
    mockSuccess(compatibilityReading);

    const reading = await apiClient.getMyCompatibilityReading("compat-1");

    expect(reading.id).toBe("compat-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/compatibility/compat-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches one public compatibility share reading", async () => {
    mockSuccess(publicCompatibilityShare);

    const reading = await apiClient.getPublicCompatibilityShare("compat-1");

    expect(reading.id).toBe("compat-1");
    expect(reading.profiles.a).not.toHaveProperty("id");
    expect(reading.charts.a).not.toHaveProperty("id");
    expect(reading.charts.a).not.toHaveProperty("profileId");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/compatibility/compat-1/share",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches current-user consultation history", async () => {
    mockSuccess({
      consultation: {
        id: "consult-1",
        profileId: "profile-1",
        chartId: "chart-1",
        question: "我适合去德国吗？",
        tone: "strategic",
        status: "completed",
        createdAt: "2026-06-02T00:00:00.000Z"
      },
      messages: []
    });

    const history = await apiClient.getMyConsultationHistory("consult-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/consultations/consult-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches anonymous consultation history with the browser anonymous user id", async () => {
    mockSuccess({
      consultation: {
        id: "consult-1",
        profileId: "profile-1",
        chartId: "chart-1",
        question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
        tone: "strategic",
        status: "completed",
        createdAt: "2026-06-02T00:00:00.000Z"
      },
      messages: []
    });

    const history = await apiClient.getConsultationHistory("consult-1", "anon-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/consultations/consult-1?anonymousUserId=anon-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("lists current-user consultations for a profile through authenticated APIs", async () => {
    mockSuccess({
      profileId: "profile-1",
      consultations: [
        {
          id: "consult-1",
          profileId: "profile-1",
          chartId: "chart-1",
          question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
          tone: "strategic",
          status: "completed",
          createdAt: "2026-06-02T00:00:00.000Z"
        }
      ]
    });

    const response = await apiClient.listMyProfileConsultations("profile-1");

    expect(response.consultations).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/consultations?profileId=profile-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("opens public consultation streams through the public endpoint", () => {
    const close = vi.fn();
    const eventSource = vi.fn(function EventSourceMock() {
      return { close, readyState: 0 };
    });
    vi.stubGlobal("EventSource", eventSource);

    const cleanup = apiClient.streamConsultation("consult-1", "anon-1", vi.fn(), vi.fn());

    expect(eventSource).toHaveBeenCalledWith("http://localhost:4000/api/v1/consultations/consult-1/stream?anonymousUserId=anon-1");
    cleanup();
    expect(close).toHaveBeenCalled();
  });

  it("opens current-user consultation streams through the authenticated endpoint with cookies", () => {
    const close = vi.fn();
    const eventSource = vi.fn(function EventSourceMock() {
      return { close, readyState: 0 };
    });
    vi.stubGlobal("EventSource", eventSource);

    const cleanup = apiClient.streamMyConsultation("consult-1", vi.fn(), vi.fn());

    expect(eventSource).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/consultations/consult-1/stream",
      { withCredentials: true }
    );
    cleanup();
    expect(close).toHaveBeenCalled();
  });

  it("surfaces a readable HTTP status when the backend returns a non-JSON error page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        headers: { get: () => "text/html" }
      })
    );

    await expect(apiClient.getPublicCompatibilityShare("compat-1")).rejects.toThrow("HTTP 502");
  });

  it("fails with a readable message when a success response body is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => {
          throw new SyntaxError("Unexpected token <");
        }
      })
    );

    await expect(apiClient.listMyCompatibilityReadings()).rejects.toThrow("无法解析后端响应");
  });
  it("treats 204 No Content responses as successful empty results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: { get: () => "" },
        json: async () => {
          throw new SyntaxError("Unexpected end of JSON input");
        }
      })
    );

    await expect(apiClient.logout()).resolves.toBeUndefined();
  });
});
