import type { PublicCompatibilityShareDto } from "@metamystic/shared";

type BuildCompatibilityShareViewInput = {
  error?: string | undefined;
  reading?: PublicCompatibilityShareDto | undefined;
};

type CompatibilityShareView =
  | {
      kind: "loading";
      message: string;
      primaryActionLabel: string;
      showSkeleton: true;
    }
  | {
      kind: "error";
      message: string;
      primaryActionLabel: string;
      showSkeleton: false;
    }
  | {
      kind: "ready";
      message: string;
      primaryActionLabel: string;
      showSkeleton: false;
    };

export function buildCompatibilityShareView(
  input: BuildCompatibilityShareViewInput
): CompatibilityShareView {
  if (input.reading) {
    return {
      kind: "ready",
      message: "查看合盘结构、互补点与沟通建议。",
      primaryActionLabel: "继续分享",
      showSkeleton: false
    };
  }

  if (input.error) {
    return {
      kind: "error",
      message: input.error,
      primaryActionLabel: "重试读取",
      showSkeleton: false
    };
  }

  return {
    kind: "loading",
    message: "正在读取合盘分享",
    primaryActionLabel: "读取中",
    showSkeleton: true
  };
}
