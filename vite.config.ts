import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiDevMiddleware } from './dev/apiDevMiddleware'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Make server-only secrets from .env / .env.local available to the /api
  // handlers in dev. They are NOT exposed to client code (no VITE_ prefix).
  const env = loadEnv(mode, process.cwd(), '')
  process.env.FOOTBALL_DATA_API_KEY ??= env.FOOTBALL_DATA_API_KEY

  return {
    plugins: [react(), tailwindcss(), apiDevMiddleware()],
  }
})
