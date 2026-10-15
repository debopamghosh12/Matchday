/**
 * Hero artwork, shown in this order. Each entry is a file in public/art/ (without extension);
 * `npm run art` writes the WebP sizes to public/art/webp/.
 *
 * `position` is the CSS object-position. The art is portrait and the hero is a wide strip,
 * so only a horizontal slice shows: the y% picks which slice (keep the face in it).
 */
export const HERO_ART: { file: string; position: string }[] = [
  { file: 'messi-trophy', position: '50% 24%' },
  { file: 'ronaldo', position: '50% 22%' },
  { file: 'haaland', position: '50% 4%' },
  { file: 'messi-portrait', position: '50% 30%' },
]

export const HERO_WIDTHS = [800, 1600] as const

/** The art panel's rendered width: full width on phones, 62% (max 900px) from 640px up. */
export const HERO_SIZES = '(min-width: 640px) min(62vw, 900px), 100vw'

export function heroSrcSet(file: string): string {
  return HERO_WIDTHS.map((w) => `/art/webp/${file}-${w}.webp ${w}w`).join(', ')
}

// TODO: fill in the illustrator's name and a link to their page.
export const ART_CREDIT = {
  name: 'TODO artist name',
  url: '#',
}
