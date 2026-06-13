"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Sparkles } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { buildGoogleAuthUrl, getApiBaseUrl } from "@/lib/public-url";
import { getAuthSuccessRedirect } from "./auth-success-redirect";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const googleAuthUrl = buildGoogleAuthUrl(getApiBaseUrl(process.env));
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("Correct Horse Battery Staple 42!");
  const [displayName, setDisplayName] = useState("\u5c0f\u7384\u540c\u5b66");
  const [message, setMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  async function submit(): Promise<void> {
    setLoading(true);
    setMessage(undefined);
    try {
      const session =
        mode === "register"
          ? await apiClient.register({ email, password, displayName })
          : await apiClient.login({ email, password });
      setMessage(`${session.user.email ?? "\u7528\u6237"} \u5df2\u767b\u5f55`);
      router.replace(getAuthSuccessRedirect("email"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "\u8ba4\u8bc1\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mystic-card rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/20 bg-amber-200/10 text-amber-200">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="gold-text text-lg font-semibold">{mode === "register" ? "\u521b\u5efa\u8d26\u53f7" : "\u767b\u5f55"}</p>
          <p className="mt-1 text-xs text-white/45">{"\u5c06\u547d\u76d8\u3001\u54a8\u8be2\u548c AI \u8bb0\u5fc6\u5b89\u5168\u7ed1\u5b9a\u5230\u4f60\u7684\u8d26\u53f7"}</p>
        </div>
      </div>
      <label className="mt-5 block text-xs text-white/55">
        {"\u90ae\u7bb1"}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
        />
      </label>
      {mode === "register" ? (
        <label className="mt-3 block text-xs text-white/55">
          {"\u6635\u79f0"}
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
          />
        </label>
      ) : null}
      <label className="mt-3 block text-xs text-white/55">
        {"\u5bc6\u7801"}
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none focus:border-[#d8a850]/50"
        />
      </label>
      <button
        type="button"
        disabled={loading}
        onClick={() => void submit()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6d4bd0] px-4 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b58df] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogIn className="h-4 w-4" />
        {loading ? "\u5904\u7406\u4e2d..." : mode === "register" ? "\u6ce8\u518c\u5e76\u767b\u5f55" : "\u767b\u5f55"}
      </button>
      <a
        href={googleAuthUrl}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72 transition hover:border-amber-200/30"
      >
        <Mail className="h-4 w-4" />
        {"Google \u767b\u5f55"}
      </a>
      {message ? <p className="mt-3 text-sm text-white/65">{message}</p> : null}
    </section>
  );
}
