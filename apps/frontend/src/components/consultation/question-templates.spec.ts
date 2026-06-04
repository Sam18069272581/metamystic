import { describe, expect, it } from "vitest";
import { findConsultationQuestionTemplate, questionTemplateCategories } from "./question-templates";

describe("consultation question templates", () => {
  it("groups templates by decision topic for the consultation form", () => {
    expect(questionTemplateCategories.map((category) => category.label)).toEqual([
      "感情",
      "事业",
      "财运",
      "学业",
      "出行",
      "关系"
    ]);
    expect(questionTemplateCategories.every((category) => category.templates.length >= 2)).toBe(true);
  });

  it("finds the selected template question text", () => {
    const template = findConsultationQuestionTemplate("career-switch");

    expect(template?.question).toBe("今年换工作时机到了吗？我应该主动争取还是先稳住？");
  });
});
