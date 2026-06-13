import { describe, expect, it } from "vitest";
import { getAuthSuccessRedirect } from "./auth-success-redirect";

describe("auth success redirect", () => {
  it("routes successful email auth to the account page with a visible success marker", () => {
    expect(getAuthSuccessRedirect("email")).toBe("/me?auth=email");
  });

  it("routes successful Google auth to the account page with a visible success marker", () => {
    expect(getAuthSuccessRedirect("google")).toBe("/me?auth=google");
  });
});
