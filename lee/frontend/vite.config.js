// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  // 인터뷰 전용 개발 서버: /interview/ 하위에서 동작
  const DEV_PORT = Number(process.env.VITE_DEV_PORT || 8501)
  const DEV_BASE = process.env.VITE_DEV_BASE || '/interview/'

  return {
    plugins: [react()],

    // dev/prod 모두 /interview/ 베이스
    base: isDev ? DEV_BASE : '/interview/',

    resolve: {
      dedupe: ['react', 'react-dom'],
    },

    server: isDev
      ? {
          host: '0.0.0.0',
          port: DEV_PORT,
          strictPort: true,

          allowedHosts: ['jobverse.site', 'www.jobverse.site'],

          // ✅ Nginx 뒤에서 HMR(WebSocket) 연결
          hmr: {
            protocol: 'wss',          // HTTPS면 wss
            host: 'jobverse.site',     // 공개 도메인
            clientPort: 443,           // 클라이언트가 접속할 포트(프록시 포트)
            path: '/interview',        // Nginx로 노출되는 WS 경로
          },

          cors: true,

          // ✅ 백엔드가 /interview-api/* 를 그대로 받음(app.js)
          proxy: {
            '/interview-api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              // ❗️치환 불필요: 백엔드가 이미 /interview-api 프리픽스를 받음
              // rewrite: p => p.replace(/^\/interview-api/, ''),
            },
          },
        }
      : undefined,
  }
})
