// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      'mealy-colligative-rena.ngrok-free.dev'
    ],
    proxy: {
      // Proxies any request starting with /api to your backend
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        // Optional: Remove '/api' from the URL before sending to backend
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  plugins: [
    react()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
