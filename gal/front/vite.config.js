import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  base: "/document/",         // ✅ 최상단에 둬야 함
  server: {
    host: "0.0.0.0",
    port: 8502,
    strictPort: true,
    hmr: false,               // ✅ HMR(웹소켓) 완전 비활성화
    allowedHosts: ["jobverse.site", "www.jobverse.site"],
    proxy: {
      "/api": { target: "http://localhost:8004", changeOrigin: true },
    },
  },
});
