import { readFile } from "node:fs/promises";

const rootPackage = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

const frontendOnlyPackages = new Set(["next", "react", "react-dom"]);
const dependencySections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const violations = [];

for (const section of dependencySections) {
  const dependencies = rootPackage[section] ?? {};
  for (const packageName of frontendOnlyPackages) {
    if (Object.hasOwn(dependencies, packageName)) {
      violations.push(`Root package.json ${section} must not include frontend-only package "${packageName}".`);
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
