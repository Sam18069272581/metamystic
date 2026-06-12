import { describe, expect, it } from "vitest";
import { buildCompatibilityShareView } from "./compatibility-share-view";

describe("buildCompatibilityShareView", () => {
  it("returns an error state instead of a loading skeleton when loading fails", () => {
    const view = buildCompatibilityShareView({
      error: "合盘分享读取失败"
    });

    expect(view.kind).toBe("error");
    expect(view.message).toBe("合盘分享读取失败");
    expect(view.showSkeleton).toBe(false);
    expect(view.primaryActionLabel).toBe("重试读取");
  });

  it("returns a loading state before any reading is available", () => {
    const view = buildCompatibilityShareView({});

    expect(view.kind).toBe("loading");
    expect(view.message).toBe("正在读取合盘分享");
    expect(view.showSkeleton).toBe(true);
  });

  it("returns a readable ready state after a reading is available", () => {
    const view = buildCompatibilityShareView({
      reading: {} as never
    });

    expect(view.kind).toBe("ready");
    expect(view.message).toBe("查看合盘结构、互补点与沟通建议。");
    expect(view.primaryActionLabel).toBe("继续分享");
  });
});
