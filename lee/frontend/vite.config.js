import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  base: '/interview/',           // ★ 핵심: 자산 경로를 /interview/ 기준으로
  server: {
    host: '0.0.0.0',
    port: 8501,
    allowedHosts: ['jobverse.site'],
    historyApiFallback: true,
    // HTTPS 프록시(nginx) 환경이면 HMR도 도메인 기준으로
    hmr: {
      host: 'jobverse.site',
      protocol: 'wss',           // HTTPS면 wss 권장 (http면 ws)
      path: '/interview',     // 필요 시 사용 (WS 경로가 루트로 가면 켜보세요)
      clientPort: 443,        // 필요 시 사용
    },
    proxy: {
      '/interview-api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
