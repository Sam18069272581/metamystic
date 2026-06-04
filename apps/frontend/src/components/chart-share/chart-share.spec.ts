import { describe, expect, it } from "vitest";
import { buildBaziSharePath, buildBaziShareUrl } from "./chart-share";

describe("chart share links", () => {
  it("builds a public Bazi share path", () => {
    expect(buildBaziSharePath("chart 1")).toBe("/share/bazi/chart%201");
  });

  it("builds an absolute public Bazi share URL", () => {
    expect(buildBaziShareUrl("https://metamystic.vercel.app", "chart-1")).toBe(
      "https://metamystic.vercel.app/share/bazi/chart-1"
    );
  });
});
