import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), svgr({ include: "**/*.svg" })],
  resolve: {
    alias: { "@": fileURLToPath(new URL("../../src", import.meta.url)) },
  },
  css: { postcss: fileURLToPath(new URL("../..", import.meta.url)) },
  define: {
    "process.env": JSON.stringify({
      NODE_ENV: "development",
      NEXT_PUBLIC_SUPABASE_URL: "https://supabase.test",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "browser-test-public-key",
    }),
  },
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
});
