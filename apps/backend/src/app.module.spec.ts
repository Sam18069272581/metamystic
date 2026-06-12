import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";
import { AppModule } from "./app.module";

describe("AppModule", () => {
  it("compiles the production application module", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    await moduleRef.close();
    expect(moduleRef).toBeDefined();
  });
});
