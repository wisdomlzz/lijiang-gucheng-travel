export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

const COORD_KEYWORDS: [RegExp, number, number][] = [
  [/北门|北/, 26.8735, 100.2325],
  [/南门|南/, 26.8650, 100.2370],
  [/白龙/, 26.8680, 100.2240],
  [/玉河/, 26.8720, 100.2295],
  [/四方街|古城中心/, 26.8710, 100.2310],
]

export function matchAddressToCoords(name: string, address?: string): { lat: number; lng: number } | null {
  const text = `${name} ${address ?? ""}`
  for (const [regex, lat, lng] of COORD_KEYWORDS) {
    if (regex.test(text)) return { lat, lng }
  }
  return null
}

export const DEFAULT_COORDS = { lat: 26.8700, lng: 100.2300 }

const MAP_RANGE = {
  latMin: 26.860, latMax: 26.880,
  lngMin: 100.220, lngMax: 100.240,
}

export function mapClickToCoords(topPct: number, leftPct: number): { lat: number; lng: number } {
  const lat = MAP_RANGE.latMax - (topPct / 100) * (MAP_RANGE.latMax - MAP_RANGE.latMin)
  const lng = MAP_RANGE.lngMin + (leftPct / 100) * (MAP_RANGE.lngMax - MAP_RANGE.lngMin)
  return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 }
}
