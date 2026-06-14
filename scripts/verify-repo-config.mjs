import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const frontendRuntimePackages = new Set(["react", "react-dom"]);
const dependencySections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const sensitiveBuildVariables = [
  "DATABASE_URL",
  "OPENAI_API_KEY",
  "DEEPSEEK_API_KEY",
  "HERMES_API_KEY",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_SECRET"
];

export function verifyRepoConfig({ rootPackage, vercelConfig, railwayConfig, dockerfile, migrationSql = "" }) {
  const violations = [];

  for (const section of dependencySections) {
    const dependencies = rootPackage[section] ?? {};
    for (const packageName of frontendRuntimePackages) {
      if (Object.hasOwn(dependencies, packageName)) {
        violations.push(`Root package.json ${section} must not include frontend-only package "${packageName}".`);
      }
    }
  }

  const deploysFrontendFromRoot =
    typeof vercelConfig.outputDirectory === "string" && vercelConfig.outputDirectory.startsWith("apps/frontend/");
  if (deploysFrontendFromRoot && !Object.hasOwn(rootPackage.devDependencies ?? {}, "next")) {
    violations.push(
      'Root package.json devDependencies must include "next" so Vercel can detect Next.js before running the monorepo build command.'
    );
  }

  if (!railwayConfig.includes('builder = "DOCKERFILE"')) {
    violations.push('railway.toml must use builder = "DOCKERFILE" so production backend builds from the audited Dockerfile.');
  }

  if (/startCommand\s*=\s*".*&&.*"/.test(railwayConfig)) {
    violations.push("railway.toml startCommand must not chain migration and server startup; use preDeployCommand for migrations.");
  }

  if (!dockerfile) {
    violations.push("A root Dockerfile is required for the Railway backend deployment.");
  } else {
    for (const variableName of sensitiveBuildVariables) {
      const sensitiveInstruction = new RegExp(`^(ARG|ENV)\\s+${variableName}(\\s|=|$)`, "m");
      if (sensitiveInstruction.test(dockerfile)) {
        violations.push(`Dockerfile must not declare sensitive variable "${variableName}" with ARG or ENV.`);
      }
    }

    if (/^CMD\s+.*prisma:deploy.*&&.*start.*$/m.test(dockerfile)) {
      violations.push(
        "Dockerfile CMD must not chain Prisma migrations and server startup; use Railway preDeployCommand for migrations."
      );
    }
  }

  if (
    migrationSql.includes('CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId")') &&
    !migrationSql.includes('DROP INDEX IF EXISTS "Profile_userId_key"')
  ) {
    violations.push('Profile_userId_key is a unique index; migrations must drop it with DROP INDEX IF EXISTS "Profile_userId_key".');
  }

  return violations;
}

async function main() {
  const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const railwayConfig = await readTextFile("../railway.toml");
  const dockerfile = await readTextFile("../Dockerfile");
  const migrationSql = await readMigrationSql();
  const violations = verifyRepoConfig({ rootPackage, vercelConfig, railwayConfig, dockerfile, migrationSql });

  if (violations.length > 0) {
    console.error("Repository configuration check failed:");
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log("Repository configuration check passed.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}

async function readTextFile(relativePath) {
  try {
    return await readFile(new URL(relativePath, import.meta.url), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}

async function readMigrationSql() {
  const { readdir } = await import("node:fs/promises");
  const migrationsDirectory = new URL("../apps/backend/prisma/migrations/", import.meta.url);
  let migrationDirectories;
  try {
    migrationDirectories = await readdir(migrationsDirectory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") {
      return "";
    }
    throw error;
  }

  const files = migrationDirectories
    .filter((entry) => entry.isDirectory())
    .map((entry) => new URL(`${entry.name}/migration.sql`, migrationsDirectory));
  const contents = await Promise.all(
    files.map(async (fileUrl) => {
      try {
        return await readFile(fileUrl, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") {
          return "";
        }
        throw error;
      }
    })
  );
  return contents.join("\n");
}
