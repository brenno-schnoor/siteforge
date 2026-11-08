import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No GitHub Pages o site fica em /siteforge/. Em desenvolvimento local e no Docker, fica na raiz.
const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: isGitHubPages ? "/siteforge/" : "/",
  plugins: [react()],
  server: { port: 3000, host: "0.0.0.0", allowedHosts: true },
  preview: { port: 3000, host: "0.0.0.0", allowedHosts: true }
});
