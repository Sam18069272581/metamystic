import { describe, expect, it } from "vitest";
import type { BaziChartDto } from "@metamystic/shared";
import { calculateBaziShensha } from "./bazi-shensha";

function pillars(input: BaziChartDto["pillars"]): BaziChartDto["pillars"] {
  return input;
}

describe("calculateBaziShensha", () => {
  it("calculates branch-group, year-branch, day-pillar, and kong-wang shensha", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "甲", branch: "子", tenGod: "偏财", hiddenStems: [] },
        month: { stem: "丁", branch: "卯", tenGod: "正官", hiddenStems: [] },
        day: { stem: "庚", branch: "辰", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "壬", branch: "午", tenGod: "食神", hiddenStems: [] }
      }),
      "庚"
    );

    expect(result.year).toContain("将星");
    expect(result.month).toContain("红鸾");
    expect(result.day).toEqual(expect.arrayContaining(["华盖", "魁罡", "十恶大败"]));
    expect(result.hour).toContain("灾煞");
  });

  it("uses both day stem and day branch rules for common nobleman and scholar stars", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "乙", branch: "亥", tenGod: "比肩", hiddenStems: [] },
        month: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [] },
        day: { stem: "癸", branch: "卯", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "辛", branch: "巳", tenGod: "七杀", hiddenStems: [] }
      }),
      "癸"
    );

    expect(result.year).toContain("羊刃");
    expect(result.month).toEqual(expect.arrayContaining(["驿马", "天乙贵人", "天德贵人"]));
    expect(result.day).toEqual(expect.arrayContaining(["将星", "天乙贵人", "文昌贵人", "天厨贵人"]));
    expect(result.hour).toEqual(expect.arrayContaining(["驿马", "天乙贵人", "天德贵人"]));
  });

  it("marks kong-wang on non-day pillars from the day pillar xun", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "壬", branch: "子", tenGod: "偏印", hiddenStems: [] },
        month: { stem: "癸", branch: "丑", tenGod: "正印", hiddenStems: [] },
        day: { stem: "乙", branch: "卯", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "丙", branch: "午", tenGod: "伤官", hiddenStems: [] }
      }),
      "乙"
    );

    expect(result.year).toContain("空亡");
    expect(result.month).toContain("空亡");
    expect(result.day).not.toContain("空亡");
  });

  it("calculates exact stem-pillar scholar stars and ordered san-qi nobleman", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "甲", branch: "子", tenGod: "偏财", hiddenStems: [] },
        month: { stem: "戊", branch: "辰", tenGod: "偏印", hiddenStems: [] },
        day: { stem: "庚", branch: "寅", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "己", branch: "亥", tenGod: "正印", hiddenStems: [] }
      }),
      "庚"
    );

    expect(result.month).toContain("三奇贵人");
    expect(result.day).toEqual(expect.arrayContaining(["词馆", "三奇贵人"]));
    expect(result.hour).toContain("学堂");
  });

  it("calculates year/day branch relationship shensha", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "甲", branch: "子", tenGod: "偏财", hiddenStems: [] },
        month: { stem: "丁", branch: "卯", tenGod: "正官", hiddenStems: [] },
        day: { stem: "庚", branch: "辰", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "辛", branch: "巳", tenGod: "劫财", hiddenStems: [] }
      }),
      "庚"
    );

    expect(result.month).toContain("勾绞煞");
    expect(result.hour).toContain("地网");
  });

  it("calculates additional special day and hour pillar shensha", () => {
    const result = calculateBaziShensha(
      pillars({
        year: { stem: "甲", branch: "子", tenGod: "偏财", hiddenStems: [] },
        month: { stem: "丙", branch: "申", tenGod: "正官", hiddenStems: [] },
        day: { stem: "辛", branch: "酉", tenGod: "日主", hiddenStems: [] },
        hour: { stem: "癸", branch: "酉", tenGod: "食神", hiddenStems: [] }
      }),
      "辛"
    );

    expect(result.day).toEqual(expect.arrayContaining(["天转", "八专", "九丑"]));
    expect(result.hour).toContain("金神");
  });
});
