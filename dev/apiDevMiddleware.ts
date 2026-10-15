// Dev-only Vite plugin that serves /api/<name> by loading api/<name>.ts and
// calling its exported GET (Web Request -> Response), the same signature Vercel
// uses in production. Lets `npm run dev` work without the Vercel CLI.

import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'

export function apiDevMiddleware(): Plugin {
  return {
    name: 'api-dev-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
        const name = url.pathname.slice('/api/'.length).replace(/\/$/, '')
        const file = path.join(server.config.root, 'api', `${name}.ts`)

        const sendJson = (status: number, body: unknown) => {
          res.statusCode = status
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(body))
        }

        // Only plain names map to functions; files under api/_lib are private.
        if (!/^[a-z0-9-]+$/i.test(name) || !fs.existsSync(file)) {
          return sendJson(404, { error: `No API route /api/${name}`, status: 404 })
        }

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
