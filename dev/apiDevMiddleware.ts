// Dev-only Vite plugin that serves /api/* by loading the matching file under api/
// and calling its exported handler (Web Request -> Response), the same signature
// Vercel uses in production. Lets `npm run dev` work without the Vercel CLI.
//
// Routing follows Vercel's file conventions:
//   /api/matches          -> api/matches.ts
//   /api/standings/PL     -> api/standings/[code].ts
//   /api/teams/65         -> api/teams/[id]/index.ts
//   /api/teams/65/matches -> api/teams/[id]/matches.ts
// Handlers read dynamic segments from the URL path themselves.

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

const SEGMENT = /^[A-Za-z0-9-]+$/

function dynamicEntry(dir: string, kind: 'file' | 'dir'): string | undefined {
  if (!fs.existsSync(dir)) return undefined
  return fs.readdirSync(dir, { withFileTypes: true }).find((e) =>
    kind === 'file' ? e.isFile() && /^\[\w+\]\.ts$/.test(e.name) : e.isDirectory() && /^\[\w+\]$/.test(e.name),
  )?.name
}

/** The api/ file that handles these path segments, or null. Private `_lib` files never match. */
export function resolveApiFile(apiRoot: string, segments: string[]): string | null {
  if (segments.length === 0 || !segments.every((s) => SEGMENT.test(s))) return null
  let dir = apiRoot
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const last = i === segments.length - 1
    if (last) {
      const candidates = [
        path.join(dir, `${segment}.ts`),
        path.join(dir, segment, 'index.ts'),
        ...[dynamicEntry(dir, 'file')].filter(Boolean).map((f) => path.join(dir, f!)),
        ...[dynamicEntry(dir, 'dir')].filter(Boolean).map((d) => path.join(dir, d!, 'index.ts')),
      ]
      return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null
    }
    const literal = path.join(dir, segment)
    if (fs.existsSync(literal) && fs.statSync(literal).isDirectory()) {
      dir = literal
      continue
    }
    const dynamic = dynamicEntry(dir, 'dir')
    if (!dynamic) return null
    dir = path.join(dir, dynamic)
  }
  return null
}

export function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
        const segments = url.pathname.slice('/api/'.length).split('/').filter(Boolean)
        const file = resolveApiFile(path.join(server.config.root, 'api'), segments)

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }

        if (!file) return sendJson(404, { error: `No API route ${url.pathname}`, status: 404 })

        try {
          const mod = await server.ssrLoadModule(file)
          const method = req.method ?? 'GET'
          const handler = mod[method]
          if (typeof handler !== 'function') {
            return sendJson(405, { error: `${method} not allowed`, status: 405 })
          }

          const headers = new Headers()
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value)
            else if (Array.isArray(value)) value.forEach((v) => headers.append(key, v))
          }

          const response: Response = await handler(new Request(url, { method, headers }))
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          if (err instanceof Error) server.ssrFixStacktrace(err)
          next(err)
        }
      })
    },
  }
}
