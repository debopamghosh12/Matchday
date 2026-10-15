import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { apiDevMiddleware } from './dev/apiDevMiddleware'

const DAY = 24 * 60 * 60

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Make server-only secrets from .env / .env.local available to the /api
  // handlers in dev. They are NOT exposed to client code (no VITE_ prefix).
  const env = loadEnv(mode, process.cwd(), '')
  if (env.FOOTBALL_DATA_API_KEY) process.env.FOOTBALL_DATA_API_KEY = env.FOOTBALL_DATA_API_KEY

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevMiddleware(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'Matchday: Football Calendar (IST)',
          short_name: 'Matchday',
          description: 'Football fixtures, results and tables with kick-off times in India time (IST).',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: '#2f5fb3',
          background_color: '#1e3f80',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell: built JS/CSS/HTML and icons. Artwork is cached on first view instead.
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          globIgnores: ['art/**'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          // Opens the match's day when a kick-off reminder is clicked.
          importScripts: ['/sw-notifications.js'],
          runtimeCaching: [
            {
              // Fixtures, tables (and the competition list the tabs/filters need):
              // network first so online data is never a step behind (live scores),
              // falling back to the last saved response when offline.
              urlPattern: ({ url, sameOrigin }) => sameOrigin && /^\/api\/(matches|standings|competitions)\b/.test(url.pathname),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-data',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 120, maxAgeSeconds: 14 * DAY },
                cacheableResponse: { statuses: [200] },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://crests.football-data.org',
              handler: 'CacheFirst',
              options: {
                cacheName: 'crests',
                expiration: { maxEntries: 400, maxAgeSeconds: 60 * DAY },
                // Cross-origin images without CORS come back opaque (status 0).
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/art/'),
              handler: 'CacheFirst',
              options: { cacheName: 'art', expiration: { maxEntries: 20, maxAgeSeconds: 60 * DAY } },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'fonts', cacheableResponse: { statuses: [0, 200] } },
            },
          ],
        },
      }),
    ],
  }
})
