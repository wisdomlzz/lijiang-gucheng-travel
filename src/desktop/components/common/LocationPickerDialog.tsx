import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { Input } from "../../../shared/components/ui/input"
import { Button } from "../../../shared/components/ui/button"
import { Search, MapPin, Crosshair, Loader2 } from "lucide-react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix default marker icon (Leaflet's default icon path is broken in bundlers)
import iconUrl from "leaflet/dist/images/marker-icon.png"
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png"
import shadowUrl from "leaflet/dist/images/marker-shadow.png"
// @ts-expect-error leaflet 内部 API 无类型声明
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const DEFAULT_CENTER: [number, number] = [26.8753, 100.2299] // 丽江古城
const DEFAULT_ZOOM = 15

type NominatimResult = {
  display_name: string
  lat: string
  lon: string
}

export function LocationPickerDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onConfirm: (name: string, lat: number, lng: number) => void
}) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [search, setSearch] = useState("")
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<{ name: string; lat: number; lng: number } | null>(null)

  // Init map
  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map)

    const marker = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map)
    markerRef.current = marker

    // Click on map — reverse geocode
    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        const name = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        setSelected({ name, lat, lng })
      } catch {
        setSelected({ name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng })
      }
    })

    // Draggable marker
    marker.on("dragend", async () => {
      const pos = marker.getLatLng()
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}&zoom=18&accept-language=zh`
        )
        const data = await res.json()
        setSelected({ name: data.display_name, lat: pos.lat, lng: pos.lng })
      } catch {
        setSelected({ name: `${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`, lat: pos.lat, lng: pos.lng })
      }
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [open])

  // Search via Nominatim
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
    const lat = parseFloat(r.lat)
    const lng = parseFloat(r.lon)
    setSelected({ name: r.display_name, lat, lng })
    setResults([])
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 16)
      markerRef.current?.setLatLng([lat, lng])
    }
  }

  const handleConfirm = () => {
    if (selected) {
      onConfirm(selected.name, selected.lat, selected.lng)
      reset()
    }
  }

  const handleLocate = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 16)
          markerRef.current?.setLatLng([latitude, longitude])
          // @ts-expect-error leaflet fire 对自定义 payload 类型不严格
          mapRef.current.fire("click", { latlng: L.latLng(latitude, longitude) } as any)
        }
      },
      () => {}
    )
  }

  const reset = () => {
    setSearch("")
    setResults([])
    setSelected(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset()
        onOpenChange(v)
      }}
    >
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-[15px] flex items-center gap-2">
            <MapPin size={16} className="text-[#059669]" />
            选择活动地点
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="搜索地点名称…"
              className="pl-9 h-9 text-[13px] rounded-lg"
            />
          </div>
          <Button size="sm" className="h-9 text-xs rounded-lg" onClick={handleSearch} disabled={searching}>
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            搜索
          </Button>
          <button
            onClick={handleLocate}
            className="size-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
            title="定位到当前位置"
          >
            <Crosshair size={14} className="text-slate-400" />
          </button>
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-100 bg-white divide-y divide-slate-50">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3 py-2 text-[12px] text-slate-600 hover:bg-slate-50 transition-colors flex items-start gap-2"
              >
                <MapPin size={12} className="mt-0.5 shrink-0 text-slate-300" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Map */}
        <div ref={containerRef} className="w-full h-64 rounded-xl border border-slate-200 overflow-hidden" />

        {/* Selected location */}
        {selected && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2">
            <MapPin size={14} className="shrink-0 text-emerald-600" />
            <span className="text-[12px] text-emerald-700 leading-relaxed line-clamp-2">{selected.name}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-lg"
            onClick={() => {
              reset()
              onOpenChange(false)
            }}
          >
            取消
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs rounded-lg bg-[#059669] hover:bg-[#047857]"
            onClick={handleConfirm}
            disabled={!selected}
          >
            确认地点
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
