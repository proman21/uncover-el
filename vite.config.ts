import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/mod.ts'),
      formats: ['es', 'cjs', 'iife'],
      name: 'uncoverEl',
      fileName: 'index',
    },
  },
})
