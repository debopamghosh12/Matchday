import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { apiDevMiddleware } from './dev/apiDevMiddleware'
import { HERO_ART, HERO_SIZES, heroSrcSet } from './src/lib/heroArt'

const DAY = 24 * 60 * 60

/**
 * The first hero image is the largest thing on Today and day pages, but React only
 * renders it after the JS loads. Start fetching it from the HTML instead, on those
 * routes only (other pages don't show it).
 */
function preloadHeroArt(): Plugin {
  const first = HERO_ART[0].file
  const script = `if (location.pathname === '/' || location.pathname.indexOf('/day/') === 0) { var l = document.createElement('link'); l.rel = 'preload'; l.as = 'image'; l.setAttribute('imagesrcset', '${heroSrcSet(first)}'); l.setAttribute('imagesizes', '${HERO_SIZES}'); l.setAttribute('fetchpriority', 'high'); document.head.appendChild(l) }`
  return {
    name: 'preload-hero-art',
    transformIndexHtml: () => [{ tag: 'script', children: script, injectTo: 'head' }],
  }
}

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
      preloadHeroArt(),
      VitePWA({
        registerType: 'autoUpdate',
        // Register the service worker after parsing instead of blocking first paint.
        injectRegister: 'script-defer',
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
          // App shell: built JS/CSS/HTML and icons. Artwork and font subsets are cached
          // on first use instead (most visitors only ever need the Latin font files).
          globPatterns: ['**/*.{js,css,html,svg,png}'],
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
              urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.endsWith('.woff2'),
              handler: 'CacheFirst',
              options: { cacheName: 'fonts', expiration: { maxEntries: 30, maxAgeSeconds: 365 * DAY } },
            },
          ],
        },
      }),
    ],
  }
})
