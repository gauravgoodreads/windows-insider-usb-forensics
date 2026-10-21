import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// The production build is served by Flask from dashboard/static/app; in dev, API calls proxy to Flask.
export default defineConfig({
  base: "/static/app/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    outDir: path.resolve(__dirname, "../dashboard/static/app"),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/reports/download": "http://127.0.0.1:5000",
    },
  },
})
