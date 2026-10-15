// Draws the app icon (a poster-style football on cobalt) and writes the PWA sizes
// to public/icons/. Run with `npm run icons`; the output is committed.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const COBALT = '#2f5fb3'
const FLARE = '#e8452c'
const CREAM = '#f4eedf'
const INK = '#141414'

// A ball: cream circle, ink outline, a centre pentagon and five panel seams.
function ball(cx, cy, r) {
  const pent = (radius, rotate = -90) =>
    Array.from({ length: 5 }, (_, i) => {
      const a = ((rotate + i * 72) * Math.PI) / 180
      return `${(cx + radius * Math.cos(a)).toFixed(1)},${(cy + radius * Math.sin(a)).toFixed(1)}`
    })
  const inner = pent(r * 0.34)
  const outer = pent(r * 0.98)
  const seams = inner.map((p, i) => `<line x1="${p.split(',')[0]}" y1="${p.split(',')[1]}" x2="${outer[i].split(',')[0]}" y2="${outer[i].split(',')[1]}" />`)
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${CREAM}" stroke="${INK}" stroke-width="${r * 0.09}" />
    <g stroke="${INK}" stroke-width="${r * 0.07}" stroke-linecap="round">${seams.join('')}</g>
    <polygon points="${inner.join(' ')}" fill="${INK}" />`
}

/**
 * `inset` is the share of the canvas kept clear on each side: maskable icons need
 * their content inside the central 80% safe zone, since launchers crop the rest.
 */
function iconSvg(size, { maskable = false } = {}) {
  const pad = size * (maskable ? 0.2 : 0.1)
  const tile = size - pad * 2
  const shadow = tile * 0.05
  const radius = maskable ? 0 : size * 0.18
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${COBALT}" />
    <rect x="${pad + shadow}" y="${pad + shadow}" width="${tile - shadow}" height="${tile - shadow}" rx="${tile * 0.12}" fill="${INK}" />
    <rect x="${pad}" y="${pad}" width="${tile - shadow}" height="${tile - shadow}" rx="${tile * 0.12}" fill="${FLARE}" stroke="${INK}" stroke-width="${tile * 0.035}" />
    ${ball(pad + (tile - shadow) / 2, pad + (tile - shadow) / 2, tile * 0.3)}
  </svg>`
}

await mkdir('public/icons', { recursive: true })
const outputs = [
  ['public/icons/icon-192.png', iconSvg(192)],
  ['public/icons/icon-512.png', iconSvg(512)],
  ['public/icons/maskable-512.png', iconSvg(512, { maskable: true })],
  ['public/icons/apple-touch-icon.png', iconSvg(180, { maskable: true })],
]
for (const [file, svg] of outputs) {
  await sharp(Buffer.from(svg)).png().toFile(file)
  console.log(file)
}
// Favicon as SVG (crisp at any size).
await import('node:fs/promises').then((fs) => fs.writeFile('public/icons/favicon.svg', iconSvg(64)))
console.log('public/icons/favicon.svg')
