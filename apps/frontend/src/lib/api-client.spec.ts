import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./api-client";

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches consultation history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            consultation: {
              id: "consult-1",
              profileId: "profile-1",
              chartId: "chart-1",
              question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
              tone: "strategic",
              status: "completed",
              createdAt: "2026-05-30T00:00:00.000Z"
            },
            messages: []
          }
        })
      })
    );

    const history = await apiClient.getConsultationHistory("consult-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/consultations/consult-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("uses readable Chinese messages for network failures", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("failed")));

    await expect(apiClient.getConsultationHistory("consult-1")).rejects.toThrow(
      "\u65e0\u6cd5\u8fde\u63a5\u540e\u7aef API"
    );
  });

  it("fetches profile memory signals", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            decisionTopics: ["\u6d77\u5916\u53d1\u5c55"],
            riskStyle: "\u7a33\u5065\u8bd5\u63a2",
            preferredTone: "\u7406\u6027\u7b56\u7565",
            sources: ["consult-1"]
          }
        })
      })
    );

    const memory = await apiClient.getProfileMemory("profile-1");

    expect(memory.decisionTopics).toEqual(["\u6d77\u5916\u53d1\u5c55"]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/profiles/profile-1/memory",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("fetches recent consultations for a profile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            profileId: "profile-1",
            consultations: [
              {
                id: "consult-1",
                profileId: "profile-1",
                chartId: "chart-1",
                question: "\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u5417\uff1f",
                tone: "strategic",
                status: "completed",
                summary: "\u9002\u5408\u5c0f\u6b65\u63a8\u8fdb",
                createdAt: "2026-05-30T10:00:00.000Z"
              }
            ]
          }
        })
      })
    );

    const response = await apiClient.listProfileConsultations("profile-1");

    expect(response.consultations).toHaveLength(1);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/consultations?profileId=profile-1",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("registers with email auth", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            user: { id: "user-1", email: "user@example.com", role: "USER" },
            accessToken: "access.jwt",
            refreshToken: "refresh-token",
            expiresIn: 900
          }
        })
      })
    );

    const session = await apiClient.register({
      email: "user@example.com",
      password: "Correct Horse Battery Staple 42!",
      displayName: "\u5c0f\u7384"
    });

    expect(session.user.email).toBe("user@example.com");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/auth/register",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("creates the current user's profile through authenticated APIs", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            id: "profile-1",
            anonymousUserId: "",
            birthTime: "1995-05-20T10:30:00.000Z",
            birthTimezone: "Europe/Berlin",
            gender: "female",
            createdAt: "2026-05-30T00:00:00.000Z",
            updatedAt: "2026-05-30T00:00:00.000Z"
          }
        })
      })
    );

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

  it("lists the current user's chart archive", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            profile: undefined,
            baziCharts: [],
            ziweiCharts: [],
            astrologyCharts: []
          }
        })
      })
    );

    const archive = await apiClient.listMyCharts();

    expect(archive.baziCharts).toEqual([]);
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/charts",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches one current-user chart detail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
            kind: "ziwei",
            chart: {
              id: "ziwei-1",
              profileId: "profile-1",
              lifePalace: "life",
              bodyPalace: "career",
              palaces: [],
              summary: "\u7d2b\u5fae\u76d8",
              createdAt: "2026-06-02T00:00:00.000Z"
            }
          }
        })
      })
    );

    const detail = await apiClient.getMyChart("ziwei", "ziwei-1");

    expect(detail.kind).toBe("ziwei");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/charts/ziwei/ziwei-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });

  it("fetches current-user consultation history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          status: "success",
          data: {
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
          }
        })
      })
    );

    const history = await apiClient.getMyConsultationHistory("consult-1");

    expect(history.consultation.id).toBe("consult-1");
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/v1/users/me/consultations/consult-1",
      expect.objectContaining({ method: "GET", credentials: "include" })
    );
  });
});
