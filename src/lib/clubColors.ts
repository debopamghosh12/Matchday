// football-data.org gives club colours as free text, e.g. "Sky Blue / White",
// "Claret / Sky Blue", "Red / White / Black". Map them to CSS colours.

const NAMED: Record<string, string> = {
  claret: '#7a263a',
  'sky blue': '#6cabdd',
  'navy blue': '#1b2a4a',
  navy: '#1b2a4a',
  'royal blue': '#1d4ed8',
  blue: '#1d4ed8',
  'dark blue': '#1e3a8a',
  'light blue': '#7dd3fc',
  red: '#d71920',
  'dark red': '#8b0000',
  white: '#ffffff',
  black: '#111111',
  yellow: '#fcd116',
  gold: '#d4a017',
  amber: '#ffbf00',
  orange: '#f47b20',
  green: '#00843d',
  'dark green': '#0b5d1e',
  purple: '#5b2c83',
  violet: '#5b2c83',
  maroon: '#800000',
  burgundy: '#800020',
  bordeaux: '#5c0120',
  grey: '#8a8d8f',
  gray: '#8a8d8f',
  silver: '#c0c0c0',
  'old gold': '#cfb53b',
  garnet: '#a50044',
  scarlet: '#ff2400',
  cherry: '#a50021',
  tangerine: '#f28500',
  pink: '#f4a7c0',
}

/** Up to three CSS colours from a clubColors string; unknown names are skipped. */
export function parseClubColors(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/\s*[/,&-]\s*|\s+and\s+/i)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((name) => NAMED[name] ?? NAMED[name.replace(/^(light|dark|deep|bright)\s+/, '')])
    .filter((c): c is string => !!c)
    .slice(0, 3)
}
