// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    plugins: [react()],

    // 로컬은 '/', 배포 빌드만 '/interview/' (뒤에 슬래시 포함)
    base: isDev ? '/' : '/interview/',

    // 로컬 개발 서버 설정
    server: isDev
      ? {
          host: '0.0.0.0',
          port: 8501,
          strictPort: true,
          // 로컬에서는 도메인/WSS/HMR 커스텀 금지 (기본 ws + localhost 사용)
          proxy: {
            // 프론트에서 fetch('/interview-api/...') 호출 시
            '/interview-api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              // 백엔드가 '/start'로 받는 구조라면 아래 주석 해제:
              // rewrite: p => p.replace(/^\/interview-api/, ''),
            },
          },
        }
      : undefined, // 배포에선 vite dev 서버 미사용(정적 빌드만 사용)
  }
})
