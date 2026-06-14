import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyRepoConfig } from "./verify-repo-config.mjs";

const validConfig = {
  rootPackage: {
    devDependencies: {
      next: "15.5.18"
    }
  },
  vercelConfig: {
    outputDirectory: "apps/frontend/.next"
  },
  railwayConfig: `
[build]
builder = "DOCKERFILE"

[deploy]
preDeployCommand = "pnpm --filter @metamystic/backend prisma:deploy"
startCommand = "pnpm --filter @metamystic/backend start"
`,
  dockerfile: `
FROM node:20-slim
CMD ["pnpm", "--filter", "@metamystic/backend", "start"]
`,
  migrationSql: `
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
DROP INDEX IF EXISTS "Profile_userId_key";
`
};

test("passes a production-ready deployment configuration", () => {
  assert.deepEqual(verifyRepoConfig(validConfig), []);
});

test("flags Dockerfile commands that chain migrations with server startup", () => {
  const violations = verifyRepoConfig({
    ...validConfig,
    dockerfile: `
FROM node:20-slim
CMD ["sh", "-c", "pnpm --filter @metamystic/backend prisma:deploy && pnpm --filter @metamystic/backend start"]
`
  });

  assert(
    violations.includes("Dockerfile CMD must not chain Prisma migrations and server startup; use Railway preDeployCommand for migrations.")
  );
});

test("flags profile migrations that try to drop a unique index as a table constraint", () => {
  const violations = verifyRepoConfig({
    ...validConfig,
    migrationSql: `
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");
ALTER TABLE "Profile" DROP CONSTRAINT IF EXISTS "Profile_userId_key";
`
  });

  assert(
    violations.includes('Profile_userId_key is a unique index; migrations must drop it with DROP INDEX IF EXISTS "Profile_userId_key".')
  );
});
