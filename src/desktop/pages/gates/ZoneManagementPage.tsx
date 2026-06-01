import { useState } from "react"
import { Card, CardContent } from "../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { PageLayout } from "../../components/common/PageLayout"
import { useZoneStore } from "../../../shared/mock"
import { Map, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

const SERVICE_TYPE_COLORS: Record<string, string> = {
  "送水服务": "bg-blue-100 text-blue-700",
  "生活垃圾清运": "bg-green-100 text-green-700",
  "建筑垃圾清运": "bg-orange-100 text-orange-700",
  "布草配送": "bg-purple-100 text-purple-700",
}

export default function ZoneManagementPage() {
  const zones = useZoneStore((s) => s.zones)
  const { removeZone, updateZone } = useZoneStore.getState()
  const [expandedZone, setExpandedZone] = useState<string | null>(null)

  return (
    <PageLayout title="片区管理" description="管理便民服务片区与服务站点">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2"><Map className="size-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">片区总数</span></div>
          <div className="text-2xl font-semibold mt-1">{zones.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm text-muted-foreground">服务站总数</div>
          <div className="text-2xl font-semibold mt-1">{zones.reduce((s, z) => s + z.stations.length, 0)}</div>
        </CardContent></Card>
      </div>
      <Card className="p-4">
        <div className="space-y-3">
          {zones.map((zone) => (
            <div key={zone.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Map className="size-5 text-primary" />
                  <span className="font-medium text-sm">{zone.name}</span>
                  <Badge variant="secondary" className="text-xs">{zone.stations.length} 个站点</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-rose-600" onClick={(e) => { e.stopPropagation(); removeZone(zone.id); toast.success("已删除片区") }}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </button>
              {expandedZone === zone.id && (
                <div className="border-t px-4 py-3 bg-gray-50/50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>站点名称</TableHead>
                        <TableHead>服务类型</TableHead>
                        <TableHead>地址</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {zone.stations.map((st) => (
                        <TableRow key={st.id}>
                          <TableCell className="font-medium">{st.name}</TableCell>
                          <TableCell>
                            <Badge className={SERVICE_TYPE_COLORS[st.serviceType] ?? "bg-gray-100 text-gray-700"}>{st.serviceType}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{st.address}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </PageLayout>
  )
}
