import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAbsoluteShareUrl, shareOrCopy, statusText } from "./share";

describe("share utilities", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds an absolute share URL from an origin and path", () => {
    expect(buildAbsoluteShareUrl("/share/compatibility/reading 1", "https://metamystic.vercel.app/")).toBe(
      "https://metamystic.vercel.app/share/compatibility/reading%201"
    );
  });

  it("uses native web share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { share });

    const result = await shareOrCopy({
      title: "合盘分享",
      text: "缘分分 76",
      url: "https://metamystic.vercel.app/share/compatibility/compat-1"
    });

    expect(result).toBe("native");
    expect(share).toHaveBeenCalledWith({
      title: "合盘分享",
      text: "缘分分 76",
      url: "https://metamystic.vercel.app/share/compatibility/compat-1"
    });
  });

  it("falls back to clipboard when native share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await shareOrCopy({
      title: "合盘分享",
      text: "缘分分 76",
      url: "https://metamystic.vercel.app/share/compatibility/compat-1"
    });

    expect(result).toBe("clipboard");
    expect(writeText).toHaveBeenCalledWith("https://metamystic.vercel.app/share/compatibility/compat-1");
  });

  it("reports unsupported when neither share nor clipboard is available", async () => {
    vi.stubGlobal("navigator", {});

    await expect(
      shareOrCopy({
        title: "合盘分享",
        text: "缘分分 76",
        url: "https://metamystic.vercel.app/share/compatibility/compat-1"
      })
    ).resolves.toBe("unsupported");
  });

  it("returns readable Chinese labels for share button states", () => {
    expect(statusText("idle")).toBe("分享");
    expect(statusText("copied")).toBe("已复制");
    expect(statusText("shared")).toBe("已分享");
    expect(statusText("unsupported")).toBe("无法分享");
  });
});
