import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ routeFileIgnorePattern: 'HomePage\\.tsx' }),
    react()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react'
            if (id.includes('@tanstack')) return 'vendor-tanstack'
            if (id.includes('msw')) return 'vendor-msw'
            return 'vendor'
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
