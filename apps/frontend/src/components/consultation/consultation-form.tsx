"use client";

import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import type { ConsultationTone, Gender } from "@metamystic/shared";
import { apiClient } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { buildConsultationFormView } from "./consultation-form-view";
import { getConsultationHistoryScope } from "./consultation-history-scope";
import { questionTemplateCategories } from "./question-templates";

interface ConsultationFormProps {
  initialChartId?: string | undefined;
  initialProfileId?: string | undefined;
}

export function ConsultationForm({ initialChartId, initialProfileId }: ConsultationFormProps) {
  const [displayName, setDisplayName] = useState("\u5c0f\u7384\u540c\u5b66");
  const [birthTime, setBirthTime] = useState("1995-05-20T10:30");
  const [gender, setGender] = useState<Gender>("female");
  const [tone, setTone] = useState<ConsultationTone>("strategic");
  const [question, setQuestion] = useState("\u6211\u9002\u5408\u53bb\u5fb7\u56fd\u53d1\u5c55\u5417\uff1f");
  const store = useAppStore();
  const anonymousUserId = useMemo(() => "local-demo-user", []);
  const formView = buildConsultationFormView({ initialChartId, initialProfileId });
  const usingSavedChart = formView.mode === "saved_chart";

  useEffect(() => {
    if (!initialChartId || !initialProfileId) {
      return;
    }
    void apiClient
      .getMyChart("bazi", initialChartId)
      .then((detail) => {
        if (!("pillars" in detail.chart)) {
          throw new Error("\u5f53\u524d\u53ea\u652f\u6301\u516b\u5b57\u5386\u53f2\u547d\u76d8\u53d1\u8d77 AI \u89e3\u8bfb\u3002");
        }
        store.setChart(detail.chart);
      })
      .catch((error: unknown) => {
        store.setError(error instanceof Error ? error.message : "\u5386\u53f2\u547d\u76d8\u8bfb\u53d6\u5931\u8d25");
      });
  }, [initialChartId, initialProfileId]);

  async function submit(): Promise<void> {
    store.setLoading(true);
    store.setError(undefined);
    store.resetStream();
    try {
      const user = await apiClient.me().catch(() => undefined);
      if (usingSavedChart && !user) {
        throw new Error("\u8bf7\u5148\u767b\u5f55\u540e\u4f7f\u7528\u5386\u53f2\u547d\u76d8\u53d1\u8d77\u54a8\u8be2\u3002");
      }
      const createdProfile = usingSavedChart
        ? undefined
        : user
          ? await apiClient.upsertMyProfile(buildProfileInput())
          : await apiClient.upsertProfile({
              anonymousUserId,
              ...buildProfileInput()
            });
      const profileId = usingSavedChart ? initialProfileId : createdProfile?.id;
      if (!profileId) {
        throw new Error("\u7f3a\u5c11\u547d\u4e3b\u6863\u6848\uff0c\u8bf7\u91cd\u65b0\u8fdb\u5165\u54a8\u8be2\u3002");
      }
      const chart = usingSavedChart
        ? await apiClient.getMyChart("bazi", initialChartId as string).then((detail) => {
            if (!("pillars" in detail.chart)) {
              throw new Error("\u5f53\u524d\u53ea\u652f\u6301\u516b\u5b57\u5386\u53f2\u547d\u76d8\u53d1\u8d77 AI \u89e3\u8bfb\u3002");
            }
            return detail.chart;
          })
        : createdProfile?.anonymousUserId
          ? await apiClient.createBaziChart({ profileId })
          : await apiClient.createMyBaziChart({ profileId });
      if (createdProfile) {
        store.setProfile(createdProfile);
      }
      store.setChart(chart);
      const consultationInput = {
        profileId,
        chartId: chart.id,
        question,
        tone
      };
      const consultation = user || usingSavedChart
        ? await apiClient.createMyConsultation(consultationInput)
        : await apiClient.createConsultation(consultationInput);
      const historyScope = getConsultationHistoryScope({ hasUser: Boolean(user), usingSavedChart });
      store.setConsultation(consultation);
      apiClient.streamConsultation(
        consultation.id,
        (event) => {
          if (event.type === "chunk") {
            store.appendStreamSection(event.section, event.content);
          }
          if (event.type === "provider") {
            store.setProviderStatus(event);
          }
          if (event.type === "done") {
            store.setLoading(false);
            const historyRequest =
              historyScope === "user"
                ? apiClient.getMyConsultationHistory(consultation.id)
                : apiClient.getConsultationHistory(consultation.id);
            void historyRequest
              .then((history) => store.setHistory(history))
              .catch((error: unknown) => {
                store.setError(
                  error instanceof Error
                    ? error.message
                    : "\u54a8\u8be2\u8bb0\u5f55\u8bfb\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"
                );
              });
            void apiClient
              .getProfileMemory(profileId)
              .then((memory) => store.setMemory(memory))
              .catch((error: unknown) => {
                store.setError(
                  error instanceof Error
                    ? error.message
                    : "\u8bb0\u5fc6\u8bfb\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"
                );
              });
            void apiClient
              .listProfileConsultations(profileId)
              .then((response) => store.setConsultations(response.consultations))
              .catch((error: unknown) => {
                store.setError(
                  error instanceof Error
                    ? error.message
                    : "\u6700\u8fd1\u54a8\u8be2\u8bfb\u53d6\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002"
                );
              });
          }
          if (event.type === "error") {
            store.setError(event.message);
            store.setLoading(false);
          }
        },
        (message) => {
          store.setError(message);
          store.setLoading(false);
        }
      );
    } catch (error) {
      store.setError(error instanceof Error ? error.message : "\u63d0\u4ea4\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
      store.setLoading(false);
    }
  }

  function buildProfileInput() {
    return {
      displayName,
      birthTime: new Date(birthTime).toISOString(),
      birthTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      gender,
      birthPlace: "\u5317\u4eac",
      latitude: 39.9042,
      longitude: 116.4074
    };
  }

  return (
    <section className="mystic-card rounded-3xl p-4">
      <div>
        <p className="gold-text text-lg font-semibold">{formView.title}</p>
        <p className="mt-2 text-xs leading-5 text-white/48">{formView.description}</p>
      </div>
      {formView.showBirthFields ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label className="text-xs text-white/55">
              {"\u6635\u79f0"}
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
              />
            </label>
            <label className="text-xs text-white/55">
              {"\u6027\u522b"}
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value as Gender)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
              >
                <option value="female">{"\u5973"}</option>
                <option value="male">{"\u7537"}</option>
                <option value="non_binary">{"\u975e\u4e8c\u5143"}</option>
                <option value="unknown">{"\u4e0d\u900f\u9732"}</option>
              </select>
            </label>
          </div>
          <label className="mt-3 block text-xs text-white/55">
            {"\u51fa\u751f\u65f6\u95f4"}
            <input
              type="datetime-local"
              value={birthTime}
              onChange={(event) => setBirthTime(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
            />
          </label>
        </>
      ) : null}
      <label className="mt-3 block text-xs text-white/55">
        {"\u5bf9\u8bdd\u98ce\u683c"}
        <select
          value={tone}
          onChange={(event) => setTone(event.target.value as ConsultationTone)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
        >
          <option value="strategic">{"\u7406\u6027\u7b56\u7565\u5efa\u8bae"}</option>
          <option value="gentle">{"\u6e29\u67d4\u60c5\u7eea\u966a\u4f34"}</option>
        </select>
      </label>
      <label className="mt-3 block text-xs text-white/55">
        {"\u4f60\u60f3\u95ee\u4ec0\u4e48\uff1f"}
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#d8a850]/50"
        />
      </label>
      <div className="mt-3 space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="gold-text text-xs font-semibold">{"\u5feb\u901f\u63d0\u95ee"}</p>
          <p className="text-[11px] text-white/38">{"\u9009\u4e00\u4e2a\u65b9\u5411\uff0c\u518d\u6839\u636e\u4f60\u7684\u60c5\u51b5\u5fae\u8c03"}</p>
        </div>
        <div className="space-y-2">
          {questionTemplateCategories.map((category) => (
            <div key={category.id} className="grid grid-cols-[2.5rem_1fr] items-start gap-2">
              <div className="rounded-full border border-amber-200/15 bg-amber-200/8 px-2 py-1 text-center text-[11px] font-medium text-amber-100/80">
                {category.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {category.templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setQuestion(template.question)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/72 transition hover:border-amber-200/30 hover:bg-amber-200/10 hover:text-amber-50"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => void submit()}
        disabled={store.loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {store.loading ? "\u63a8\u6f14\u4e2d..." : formView.submitLabel}
      </button>
      {store.error ? <p className="mt-3 text-sm text-rose-300">{store.error}</p> : null}
    </section>
  );
}
