import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 確保部署到 GitHub Pages 時靜態資源路徑正確
  plugins: [
    react(),
    tailwindcss(),
  ],
})
