import { useState, useRef, useEffect } from "react"
import { Input } from "../../../../shared/components/ui/input"
import { Button } from "../../../../shared/components/ui/button"
import { Search, MapPin, Crosshair, Loader2 } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"

type NominatimResult = { display_name: string; lat: string; lon: string }

const MAP_DEFAULT: [number, number] = [26.8753, 100.2299]

export function LocationMapField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState("")
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })
    const map = L.map(containerRef.current, { center: MAP_DEFAULT, zoom: 15 })
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OSM" }).addTo(map)
    const marker = L.marker(MAP_DEFAULT, { draggable: true }).addTo(map)
    markerRef.current = marker
    map.on("click", async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        onChange(data.display_name || `${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
      } catch {
        onChange(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`)
      }
    })
    marker.on("dragend", async () => {
      const pos = marker.getLatLng()
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        onChange(data.display_name || `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
      } catch {
        onChange(`${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
      }
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=5&accept-language=zh`
      )
      const data: NominatimResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  const handleSelectResult = (r: NominatimResult) => {
    const lat = parseFloat(r.lat),
      lng = parseFloat(r.lon)
    onChange(r.display_name)
    setResults([])
    mapRef.current?.setView([lat, lng], 16)
    markerRef.current?.setLatLng([lat, lng])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="搜索地点名称…"
            className="pl-9 h-8 text-[12px] rounded-lg"
          />
        </div>
        <Button size="sm" className="h-8 text-[11px] rounded-lg" onClick={handleSearch} disabled={searching}>
          {searching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
          搜索
        </Button>
        <button
          onClick={() => {
            if (!navigator.geolocation) return
            navigator.geolocation.getCurrentPosition((p) => {
              mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 16)
              markerRef.current?.setLatLng([p.coords.latitude, p.coords.longitude])
            })
          }}
          className="size-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 shrink-0"
          title="定位"
        >
          <Crosshair size={13} className="text-slate-400" />
        </button>
      </div>
      {results.length > 0 && (
        <div className="max-h-28 overflow-y-auto rounded-lg border border-slate-100 bg-white divide-y">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectResult(r)}
              className="w-full text-left px-2.5 py-1.5 text-[11px] text-slate-600 hover:bg-slate-50 flex items-start gap-1.5"
            >
              <MapPin size={11} className="mt-0.5 shrink-0 text-slate-300" />
              <span className="line-clamp-1">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
      <div ref={containerRef} className="w-full h-44 rounded-lg border border-slate-200 overflow-hidden" />
      {value && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 flex items-center gap-1.5">
          <MapPin size={12} className="shrink-0 text-emerald-600" />
          <span className="text-[11px] text-emerald-700 line-clamp-1">{value}</span>
        </div>
      )}
    </div>
  )
}