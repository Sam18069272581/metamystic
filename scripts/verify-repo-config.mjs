import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const railwayConfig = await readTextFile("../railway.toml");
const dockerfile = await readTextFile("../Dockerfile");

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
const violations = [];

for (const section of dependencySections) {
  const dependencies = rootPackage[section] ?? {};
  for (const packageName of frontendRuntimePackages) {
    if (Object.hasOwn(dependencies, packageName)) {
      violations.push(`Root package.json ${section} must not include frontend-only package "${packageName}".`);
    }
  }
}

const deploysFrontendFromRoot = typeof vercelConfig.outputDirectory === "string" && vercelConfig.outputDirectory.startsWith("apps/frontend/");
if (deploysFrontendFromRoot && !Object.hasOwn(rootPackage.devDependencies ?? {}, "next")) {
  violations.push('Root package.json devDependencies must include "next" so Vercel can detect Next.js before running the monorepo build command.');
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
}

if (violations.length > 0) {
  console.error("Repository configuration check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Repository configuration check passed.");

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
