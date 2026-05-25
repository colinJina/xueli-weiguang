import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const packageJsonPath = resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const dependencyGroups = [
  ["dependencies", packageJson.dependencies ?? {}],
  ["devDependencies", packageJson.devDependencies ?? {}],
  ["peerDependencies", packageJson.peerDependencies ?? {}],
  ["optionalDependencies", packageJson.optionalDependencies ?? {}],
];

const errors = [];

function getVersion(groupName, packageName) {
  const group = dependencyGroups.find(([name]) => name === groupName)?.[1] ?? {};
  return group[packageName];
}

function getDeclaredGroups(packageName) {
  return dependencyGroups
    .filter(([, group]) => packageName in group)
    .map(([name]) => name);
}

function getMajor(version) {
  const match = version.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function expectSingleGroup(packageName, expectedGroup) {
  const groups = getDeclaredGroups(packageName);

  if (groups.length === 0) {
    errors.push(`Missing required package "${packageName}" in ${expectedGroup}.`);
    return;
  }

  if (groups.length > 1) {
    errors.push(`Package "${packageName}" is declared in multiple groups: ${groups.join(", ")}.`);
  }

  if (groups[0] !== expectedGroup) {
    errors.push(`Package "${packageName}" must be declared in ${expectedGroup}, found in ${groups[0]}.`);
  }
}

function expectSameVersion(packageA, packageB, groupName) {
  const versionA = getVersion(groupName, packageA);
  const versionB = getVersion(groupName, packageB);

  if (!versionA || !versionB) {
    return;
  }

  if (versionA !== versionB) {
    errors.push(
      `Package versions for "${packageA}" and "${packageB}" must match in ${groupName}: ${versionA} vs ${versionB}.`,
    );
  }
}

expectSingleGroup("next", "dependencies");
expectSingleGroup("react", "dependencies");
expectSingleGroup("react-dom", "dependencies");
expectSingleGroup("eslint-config-next", "devDependencies");
expectSingleGroup("@types/react", "devDependencies");
expectSingleGroup("@types/react-dom", "devDependencies");

expectSameVersion("react", "react-dom", "dependencies");
expectSameVersion("@types/react", "@types/react-dom", "devDependencies");

const nextVersion = getVersion("dependencies", "next");
const reactVersion = getVersion("dependencies", "react");
const reactDomVersion = getVersion("dependencies", "react-dom");
const eslintConfigNextVersion = getVersion("devDependencies", "eslint-config-next");
const typesReactVersion = getVersion("devDependencies", "@types/react");
const typesReactDomVersion = getVersion("devDependencies", "@types/react-dom");

const nextMajor = nextVersion ? getMajor(nextVersion) : null;
const reactMajor = reactVersion ? getMajor(reactVersion) : null;
const reactDomMajor = reactDomVersion ? getMajor(reactDomVersion) : null;
const eslintConfigNextMajor = eslintConfigNextVersion ? getMajor(eslintConfigNextVersion) : null;
const typesReactMajor = typesReactVersion ? getMajor(typesReactVersion) : null;
const typesReactDomMajor = typesReactDomVersion ? getMajor(typesReactDomVersion) : null;

if (reactMajor !== null && reactDomMajor !== null && reactMajor !== reactDomMajor) {
  errors.push(`React major version mismatch: react@${reactVersion} vs react-dom@${reactDomVersion}.`);
}

if (nextMajor !== null && eslintConfigNextMajor !== null && nextMajor !== eslintConfigNextMajor) {
  errors.push(`Next major version mismatch: next@${nextVersion} vs eslint-config-next@${eslintConfigNextVersion}.`);
}

if (reactMajor !== null && typesReactMajor !== null && reactMajor !== typesReactMajor) {
  errors.push(`React type major version mismatch: react@${reactVersion} vs @types/react@${typesReactVersion}.`);
}

if (reactDomMajor !== null && typesReactDomMajor !== null && reactDomMajor !== typesReactDomMajor) {
  errors.push(
    `React DOM type major version mismatch: react-dom@${reactDomVersion} vs @types/react-dom@${typesReactDomVersion}.`,
  );
}

if (nextMajor === 15 && reactMajor !== null && reactMajor !== 19) {
  errors.push(`Next 15 projects must use React 19. Found react@${reactVersion}.`);
}

if (errors.length > 0) {
  console.error("Dependency health check failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Dependency health check passed.");
