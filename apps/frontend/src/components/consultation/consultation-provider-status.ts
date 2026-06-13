import type { ConsultationProviderEvent } from "@metamystic/shared";

export interface ProviderStatusViewModel {
  tone: "primary" | "fallback";
  title: string;
  detail: string;
}

export function formatProviderStatus(status: ConsultationProviderEvent): ProviderStatusViewModel {
  if (status.isFallback) {
    const failedProvider = status.failedProviderName ?? "\u4e3b\u6a21\u578b";
    return {
      tone: "fallback",
      title: "\u5907\u7528\u5206\u6790\u6a21\u5f0f",
      detail: `\u4e3b\u6a21\u578b ${failedProvider} \u6682\u65f6\u4e0d\u53ef\u7528\uff0c\u5df2\u5207\u6362\u5230 ${status.providerName} / ${status.model}\u3002`
    };
  }

  return {
    tone: "primary",
    title: "AI \u6a21\u578b\u8fde\u63a5\u4e2d",
    detail: `\u5f53\u524d\u4f7f\u7528 ${status.providerName} / ${status.model} \u8fdb\u884c\u547d\u7406\u5206\u6790\u3002`
  };
}
