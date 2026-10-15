// Converts the hero artwork in public/art/ to WebP at the widths the hero's srcset uses.
// Run with `npm run art` after adding or replacing an image; the output is committed.
import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'public/art'
const OUT = 'public/art/webp'
const WIDTHS = [800, 1600]

// Optional source crops (px in the original), e.g. to drop a poster's white margin.
const CROPS = {
  haaland: { left: 80, top: 64, width: 580, height: 856 },
}

await mkdir(OUT, { recursive: true })
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f))

for (const file of files) {
  const name = path.parse(file).name
  const meta = await sharp(path.join(SRC, file)).metadata()
  for (const width of WIDTHS) {
    let img = sharp(path.join(SRC, file))
    if (CROPS[name]) img = img.extract(CROPS[name])
    const out = path.join(OUT, `${name}-${width}.webp`)
    const info = await img.resize({ width, kernel: 'lanczos3' }).webp({ quality: 80, effort: 6 }).toFile(out)
    const sourceWidth = CROPS[name]?.width ?? meta.width
    const note = sourceWidth < width ? `  (upscaled from ${sourceWidth}px source)` : ''
    console.log(`${out}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB${note}`)
  }
}
