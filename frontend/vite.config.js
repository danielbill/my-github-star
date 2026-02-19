import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic'
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.message.includes("'use client'")) {
          return
        }
        warn(warning)
      }
    }
  }
})
