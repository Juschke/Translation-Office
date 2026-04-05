import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://dev.itc-ks.com',
        changeOrigin: true,
        headers: {
          Accept: 'application/json',
          "X-Requested-With": "XMLHttpRequest",
        },
      },
      '/sanctum': {
        target: 'https://dev.itc-ks.com',
        changeOrigin: true,
      }
    }
  }
})

