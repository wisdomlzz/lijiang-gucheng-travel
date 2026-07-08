import { useState, useMemo } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Button } from "../../../../shared/components/ui/button"
import { Badge } from "../../../../shared/components/ui/badge"
import { Input } from "../../../../shared/components/ui/input"
import { Label } from "../../../../shared/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../shared/components/ui/dialog"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useZoneStore } from "../../store"
import type { Zone, ServiceStation } from "../../store/zone-store"
import type { ConvenienceServiceType } from "../../../../shared/types"
import { Map, Plus, Trash2, Pencil, ChevronDown, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"

const SERVICE_TYPE_COLORS: Record<string, string> = {
  送水服务: "bg-blue-100 text-blue-700",
  生活垃圾清运: "bg-green-100 text-green-700",
  建筑垃圾清运: "bg-orange-100 text-orange-700",
  布草配送: "bg-purple-100 text-purple-700",
}

const ZONE_SERVICE_TYPES: ConvenienceServiceType[] = ["送水服务", "生活垃圾清运", "建筑垃圾清运", "布草配送"]

type ZoneFormMode = { kind: "add" } | { kind: "edit"; zone: Zone } | null

export default function ZoneManagementPage() {
  const zones = useZoneStore((s) => s.zones)
  const { addZone, removeZone, updateZone, addStation, removeStation } = useZoneStore.getState()

  const [expandedZone, setExpandedZone] = useState<string | null>(null)
  const [zoneForm, setZoneForm] = useState<ZoneFormMode>(null)
  const [zoneName, setZoneName] = useState("")
  const [zoneSearch, setZoneSearch] = useState("")
  const filteredZones = useMemo(() => {
    if (!zoneSearch.trim()) return zones
    const q = zoneSearch.trim().toLowerCase()
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.stations.some((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
    )
  }, [zones, zoneSearch])
  const [stationDialogZoneId, setStationDialogZoneId] = useState<string | null>(null)
  const [stationForm, setStationForm] = useState({
    name: "",
    serviceType: ZONE_SERVICE_TYPES[0] as ConvenienceServiceType,
    address: "",
    lat: "26.8721",
    lng: "100.2299",
  })

  const openAddZone = () => {
    setZoneName("")
    setZoneForm({ kind: "add" })
  }

  const openEditZone = (zone: Zone) => {
    setZoneName(zone.name)
    setZoneForm({ kind: "edit", zone })
  }

  const submitZone = async () => {
    if (!zoneForm) return
    const name = zoneName.trim()
    if (!name) {
      toast.error("请输入片区名称")
      return
    }
    if (zoneForm.kind === "add") {
      const zone: Zone = {
        id: `zone_${Date.now().toString(36)}`,
        name,
        stations: [],
      }
      await addZone(zone)
      toast.success("已新增片区")
    } else {
      await updateZone(zoneForm.zone.id, { name })
      toast.success("已更新片区")
    }
    setZoneForm(null)
  }

  const handleRemoveZone = async (zone: Zone) => {
    if (!window.confirm(`确认删除片区「${zone.name}」?`)) return
    await removeZone(zone.id)
    toast.success("已删除片区")
  }

  const openAddStation = (zoneId: string) => {
    setStationForm({
      name: "",
      serviceType: ZONE_SERVICE_TYPES[0],
      address: "",
      lat: "26.8721",
      lng: "100.2299",
    })
    setStationDialogZoneId(zoneId)
  }

  const submitStation = async () => {
    if (!stationDialogZoneId) return
    const name = stationForm.name.trim()
    const address = stationForm.address.trim()
    if (!name || !address) {
      toast.error("请填写站点名称与地址")
      return
    }
    const lat = parseFloat(stationForm.lat)
    const lng = parseFloat(stationForm.lng)
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      toast.error("经纬度需为数字")
      return
    }
    const station: ServiceStation = {
      id: `st_${Date.now().toString(36)}`,
      zoneId: stationDialogZoneId,
      serviceType: stationForm.serviceType,
      name,
      address,
      lat,
      lng,
    }
    await addStation(stationDialogZoneId, station)
    toast.success("已添加站点")
    setStationDialogZoneId(null)
  }

  const handleRemoveStation = async (zoneId: string, station: ServiceStation) => {
    if (!window.confirm(`确认删除站点「${station.name}」?`)) return
    await removeStation(zoneId, station.id)
    toast.success("已删除站点")
  }

  return (
    <PageLayout title="片区管理" description="管理便民服务片区与服务站点">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Map className="size-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">片区总数</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{zones.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">服务站总数</div>
            <div className="text-2xl font-semibold mt-1">{zones.reduce((s, z) => s + z.stations.length, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="搜索片区或站点..."
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {zoneSearch.trim() ? `${filteredZones.length} / ${zones.length} 个片区` : `共 ${zones.length} 个片区`}
            </div>
          </div>
          <Button size="sm" onClick={openAddZone}>
            <Plus className="size-4 mr-1" />
            新增片区
          </Button>
        </div>

        <div className="space-y-3">
          {filteredZones.map((zone) => {
            const isExpanded = expandedZone === zone.id
            return (
              <div key={zone.id} className="border rounded-lg overflow-hidden">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedZone(isExpanded ? null : zone.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setExpandedZone(isExpanded ? null : zone.id)
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                    <Map className="size-5 text-primary" />
                    <span className="font-medium text-sm">{zone.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {zone.stations.length} 个站点
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEditZone(zone)
                      }}
                    >
                      <Pencil className="size-3 mr-1" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveZone(zone)
                      }}
                    >
                      <Trash2 className="size-3 mr-1" />
                      删除
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 py-3 bg-gray-50/50">
                    {zone.stations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>站点名称</TableHead>
                            <TableHead>服务类型</TableHead>
                            <TableHead>地址</TableHead>
                            <TableHead className="w-24 text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {zone.stations.map((st) => (
                            <TableRow key={st.id}>
                              <TableCell className="font-medium">{st.name}</TableCell>
                              <TableCell>
                                <Badge className={SERVICE_TYPE_COLORS[st.serviceType] ?? "bg-gray-100 text-gray-700"}>
                                  {st.serviceType}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{st.address}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-rose-600 hover:text-rose-700"
                                  onClick={() => handleRemoveStation(zone.id, st)}
                                >
                                  <Trash2 className="size-3 mr-1" />
                                  删除
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-sm text-muted-foreground py-4 text-center">暂无站点</div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="outline" onClick={() => openAddStation(zone.id)}>
                        <Plus className="size-4 mr-1" />
                        添加站点
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {filteredZones.length === 0 && (
            <div className="text-sm text-muted-foreground py-10 text-center">
              {zoneSearch.trim() ? "无匹配的片区" : "暂无片区，点击右上角「新增片区」开始"}
            </div>
          )}
        </div>
      </Card>

      {/* Zone Add/Edit Dialog */}
      <Dialog open={zoneForm !== null} onOpenChange={(open) => !open && setZoneForm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{zoneForm?.kind === "edit" ? "编辑片区" : "新增片区"}</DialogTitle>
            <DialogDescription>
              {zoneForm?.kind === "edit" ? "修改片区名称。" : "创建一个新的服务片区，可稍后添加站点。"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="zone-name">片区名称</Label>
              <Input
                id="zone-name"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="例如：大研古城北片区"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoneForm(null)}>
              取消
            </Button>
            <Button onClick={submitZone}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Station Dialog */}
      <Dialog open={stationDialogZoneId !== null} onOpenChange={(open) => !open && setStationDialogZoneId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加站点</DialogTitle>
            <DialogDescription>为片区添加一个服务站点。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="station-name">站点名称</Label>
              <Input
                id="station-name"
                value={stationForm.name}
                onChange={(e) => setStationForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：四方街送水点"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-type">服务类型</Label>
              <select
                id="station-type"
                value={stationForm.serviceType}
                onChange={(e) =>
                  setStationForm((f) => ({ ...f, serviceType: e.target.value as ConvenienceServiceType }))
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {ZONE_SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="station-address">地址</Label>
              <Input
                id="station-address"
                value={stationForm.address}
                onChange={(e) => setStationForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="例如：大研古城四方街 12 号"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="station-lat">纬度 (lat)</Label>
                <Input
                  id="station-lat"
                  value={stationForm.lat}
                  onChange={(e) => setStationForm((f) => ({ ...f, lat: e.target.value }))}
                  placeholder="26.8721"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="station-lng">经度 (lng)</Label>
                <Input
                  id="station-lng"
                  value={stationForm.lng}
                  onChange={(e) => setStationForm((f) => ({ ...f, lng: e.target.value }))}
                  placeholder="100.2299"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStationDialogZoneId(null)}>
              取消
            </Button>
            <Button onClick={submitStation}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
