import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command }) => ({
  // GitHub Pages는 /hanbyul-game/ 하위 경로에서 서빙됨 (로컬 dev는 / 유지)
  base: command === 'build' ? '/hanbyul-game/' : '/',
  plugins: [react(), tailwindcss()],
}))
