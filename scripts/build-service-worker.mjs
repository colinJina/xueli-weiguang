import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";
import sharp from "sharp";
import { injectManifest } from "workbox-build";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const publicDirectory = path.join(projectRoot, "public");
const iconDirectory = path.join(publicDirectory, "icons");
const temporaryBundlePath = path.join(projectRoot, ".tmp", "service-worker.js");
const serviceWorkerPath = path.join(publicDirectory, "sw.js");
const sourceIconPath = path.join(projectRoot, "src", "app", "icon.svg");
const badgeIconPath = path.join(
  projectRoot,
  "src",
  "assets",
  "notification-badge.svg",
);
const isProduction = process.argv.includes("--production");

await mkdir(iconDirectory, { recursive: true });
await mkdir(path.dirname(temporaryBundlePath), { recursive: true });

await Promise.all([
  sharp(sourceIconPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconDirectory, "app-192.png")),
  sharp(sourceIconPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconDirectory, "app-512.png")),
  sharp(sourceIconPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconDirectory, "notification-icon-192.png")),
  sharp(badgeIconPath)
    .resize(96, 96)
    .png()
    .toFile(path.join(iconDirectory, "notification-badge-96.png")),
]);

await build({
  bundle: true,
  define: {
    __IS_PRODUCTION__: JSON.stringify(isProduction),
    __VAPID_PUBLIC_KEY__: JSON.stringify(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
    ),
  },
  entryPoints: [path.join(projectRoot, "src", "service-worker.ts")],
  format: "iife",
  legalComments: "none",
  minify: isProduction,
  outfile: temporaryBundlePath,
  platform: "browser",
  sourcemap: false,
  target: ["chrome80", "edge80", "firefox78", "safari16"],
});

const result = await injectManifest({
  globDirectory: publicDirectory,
  globPatterns: ["icons/*.png"],
  maximumFileSizeToCacheInBytes: 512 * 1024,
  swDest: serviceWorkerPath,
  swSrc: temporaryBundlePath,
});

await rm(temporaryBundlePath, { force: true });

for (const warning of result.warnings) {
  console.warn(`[workbox] ${warning}`);
}

console.log(
  `[workbox] generated public/sw.js with ${result.count} precached files (${result.size} bytes)`,
);
