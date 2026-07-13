import type { AiAccessDto } from "@metamystic/shared";

export interface ConsultationFormViewInput {
  initialChartId?: string | undefined;
  initialProfileId?: string | undefined;
}

export interface ConsultationFormView {
  mode: "direct_birth_input" | "saved_chart";
  title: string;
  description: string;
  showBirthFields: boolean;
  submitLabel: string;
  accessBadge: string;
  accessHint: string;
}

const publicBetaCopy = {
  accessBadge: "\u516c\u6d4b\u514d\u8d39",
  accessHint: "\u533f\u540d\u7528\u6237\u6bcf\u65e5 5 \u6b21\uff0c\u767b\u5f55\u540e\u6bcf\u65e5 30 \u6b21"
};

export function buildConsultationFormView({
  initialChartId,
  initialProfileId
}: ConsultationFormViewInput): ConsultationFormView {
  if (initialChartId && initialProfileId) {
    return {
      mode: "saved_chart",
      title: "\u4f7f\u7528\u5df2\u4fdd\u5b58\u547d\u76d8\u5206\u6790",
      description:
        "\u5df2\u9501\u5b9a\u8fd9\u5f20\u5386\u53f2\u516b\u5b57\u547d\u76d8\uff0c\u53ea\u9700\u8f93\u5165\u95ee\u9898\u5373\u53ef\u5f00\u59cb AI \u89e3\u8bfb\u3002",
      showBirthFields: false,
      submitLabel: "\u7528\u8fd9\u5f20\u547d\u76d8\u5f00\u59cb\u5206\u6790",
      ...publicBetaCopy
    };
  }

  return {
    mode: "direct_birth_input",
    title: "\u65b0\u5efa AI \u547d\u7406\u5206\u6790",
    description:
      "\u586b\u5199\u51fa\u751f\u4fe1\u606f\u540e\uff0c\u7cfb\u7edf\u4f1a\u751f\u6210\u547d\u76d8\u5e76\u5f00\u59cb\u5206\u6790\u3002",
    showBirthFields: true,
    submitLabel: "\u5f00\u59cb AI \u547d\u7406\u5206\u6790",
    ...publicBetaCopy
  };
}

export function formatAiAccessHint(access: AiAccessDto): string {
  if (access.mode === "public_beta") {
    return `\u4eca\u65e5\u5269\u4f59 ${access.remaining} \u6b21\uff0c\u672c\u6b21\u4e0d\u6536\u8d39`;
  }
  return access.charged ? "\u672c\u6b21\u5c06\u4f7f\u7528\u4ed8\u8d39\u989d\u5ea6" : "\u5f53\u524d\u4e0d\u6536\u8d39";
}
