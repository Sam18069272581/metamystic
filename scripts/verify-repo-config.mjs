import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

const frontendRuntimePackages = new Set(["react", "react-dom"]);
const dependencySections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
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

if (violations.length > 0) {
  console.error("Repository configuration check failed:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Repository configuration check passed.");
