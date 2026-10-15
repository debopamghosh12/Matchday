// Where each league's qualification and relegation places are. Rules differ per
// league and change between seasons, so they live here as plain config.

export type ZoneTone = 'top' | 'second' | 'third' | 'playoff' | 'down'

export interface Zone {
  from: number
  to: number
  label: string
  tone: ZoneTone
}

const z = (from: number, to: number, label: string, tone: ZoneTone): Zone => ({ from, to, label, tone })

const UCL = 'Champions League'
const UCL_Q = 'Champions League qualifying'
const UEL = 'Europa League'
const UECL = 'Conference League'
const RELEGATION = 'Relegation'
const RELEGATION_PO = 'Relegation play-off'

/** Keyed by competition code; for cups, by stage too (e.g. the CL league phase). */
export const ZONES: Record<string, Zone[]> = {
  PL: [z(1, 4, UCL, 'top'), z(5, 5, UEL, 'second'), z(6, 6, UECL, 'third'), z(18, 20, RELEGATION, 'down')],
  PD: [z(1, 4, UCL, 'top'), z(5, 6, UEL, 'second'), z(7, 7, UECL, 'third'), z(18, 20, RELEGATION, 'down')],
  SA: [z(1, 4, UCL, 'top'), z(5, 6, UEL, 'second'), z(7, 7, UECL, 'third'), z(18, 20, RELEGATION, 'down')],
  BL1: [
    z(1, 4, UCL, 'top'),
    z(5, 6, UEL, 'second'),
    z(7, 7, UECL, 'third'),
    z(16, 16, RELEGATION_PO, 'playoff'),
    z(17, 18, RELEGATION, 'down'),
  ],
  FL1: [
    z(1, 3, UCL, 'top'),
    z(4, 4, UCL_Q, 'top'),
    z(5, 5, UEL, 'second'),
    z(6, 6, UECL, 'third'),
    z(16, 16, RELEGATION_PO, 'playoff'),
    z(17, 18, RELEGATION, 'down'),
  ],
  DED: [
    z(1, 2, UCL, 'top'),
    z(3, 3, UCL_Q, 'top'),
    z(4, 4, UEL, 'second'),
    z(5, 5, UECL, 'third'),
    z(16, 17, RELEGATION_PO, 'playoff'),
    z(18, 18, RELEGATION, 'down'),
  ],
  PPL: [
    z(1, 2, UCL, 'top'),
    z(3, 3, UCL_Q, 'top'),
    z(4, 4, UEL, 'second'),
    z(5, 5, UECL, 'third'),
    z(16, 16, RELEGATION_PO, 'playoff'),
    z(17, 18, RELEGATION, 'down'),
  ],
  ELC: [z(1, 2, 'Promotion', 'top'), z(3, 6, 'Promotion play-offs', 'playoff'), z(22, 24, RELEGATION, 'down')],
  BSA: [
    z(1, 4, 'Copa Libertadores', 'top'),
    z(5, 6, 'Libertadores qualifying', 'second'),
    z(7, 12, 'Copa Sudamericana', 'third'),
    z(17, 20, RELEGATION, 'down'),
  ],
  'CL:LEAGUE_STAGE': [z(1, 8, 'Round of 16', 'top'), z(9, 24, 'Knockout play-offs', 'second'), z(25, 36, 'Eliminated', 'down')],
}

export function zonesFor(code: string, stage: string): Zone[] {
  return ZONES[`${code}:${stage}`] ?? ZONES[code] ?? []
}

export function zoneAt(zones: Zone[], position: number): Zone | undefined {
  return zones.find((zone) => position >= zone.from && position <= zone.to)
}

/** Legend entries: one per distinct label, in table order. */
export function legendFor(zones: Zone[]): Zone[] {
  const seen = new Set<string>()
  return zones.filter((zone) => !seen.has(zone.label) && seen.add(zone.label))
}

export const ZONE_BG: Record<ZoneTone, string> = {
  top: 'bg-zone-top',
  second: 'bg-zone-second',
  third: 'bg-zone-third',
  playoff: 'bg-zone-playoff',
  down: 'bg-zone-down',
}
