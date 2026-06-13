import { describe, expect, it } from "vitest";
import { getConsultationHistoryScope } from "./consultation-history-scope";

describe("consultation history scope", () => {
  it("uses the authenticated history endpoint for signed-in consultations", () => {
    expect(getConsultationHistoryScope({ hasUser: true, usingSavedChart: false })).toBe("user");
  });

  it("uses the authenticated history endpoint for saved chart consultations", () => {
    expect(getConsultationHistoryScope({ hasUser: false, usingSavedChart: true })).toBe("user");
  });

  it("uses the public history endpoint for anonymous consultations", () => {
    expect(getConsultationHistoryScope({ hasUser: false, usingSavedChart: false })).toBe("public");
  });
});
