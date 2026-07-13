import { describe, expect, it } from "vitest";
import { dictionaries, getDictionary, isLocale, switchLocalePath, withLocale } from "./i18n";

describe("i18n route helpers", () => {
  it("detects supported locales", () => {
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("prefixes internal paths with the active locale", () => {
    expect(withLocale("/me", "zh")).toBe("/zh/me");
    expect(withLocale("consult", "en")).toBe("/en/consult");
    expect(withLocale("/", "en")).toBe("/en");
  });

  it("switches locale while preserving the current route", () => {
    expect(switchLocalePath("/zh/consult", "en")).toBe("/en/consult");
    expect(switchLocalePath("/consult", "en")).toBe("/en/consult");
    expect(switchLocalePath("/en/charts/bazi?profileId=1", "zh")).toBe("/zh/charts/bazi?profileId=1");
  });
});

describe("i18n dictionaries", () => {
  it("keeps Chinese and English dictionary sections aligned", () => {
    expect(Object.keys(dictionaries.en).sort()).toEqual(Object.keys(dictionaries.zh).sort());
    expect(Object.keys(getDictionary("en").home).sort()).toEqual(Object.keys(getDictionary("zh").home).sort());
    expect(Object.keys(getDictionary("en").shell.nav).sort()).toEqual(Object.keys(getDictionary("zh").shell.nav).sort());
  });
});
