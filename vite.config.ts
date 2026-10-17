import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages: https://retrodig.github.io/alefgard/
export default defineConfig({
  base: '/alefgard/',
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
