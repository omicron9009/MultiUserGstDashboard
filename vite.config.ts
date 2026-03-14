import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/auth": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/dashboard": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/gstr1": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/gstr2A": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/gstr2B": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/gstr3B": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/gstr9": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/ledgers": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      "/return_status": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
