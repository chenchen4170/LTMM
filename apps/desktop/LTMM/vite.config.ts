import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Electron 生产环境用 file:// 加载，静态资源必须用相对路径
  base: './',
  plugins: [react()],
})
