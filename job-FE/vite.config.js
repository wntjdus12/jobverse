import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173, // Vite 프론트엔드 서버 포트
    proxy: {
      '/api': {
        target: 'http://3.39.202.109:5000', // 백엔드 서버 주소
        changeOrigin: true,
        rewrite: path => path, // '/user/me' → 그대로 전달
      }
    }
  }
})
