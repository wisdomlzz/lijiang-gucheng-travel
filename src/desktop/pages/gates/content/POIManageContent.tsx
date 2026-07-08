import { useState } from "react"
import { Card } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useContentPOIStore } from "../../../../platform/content/poi-store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

const CATEGORY_LABELS: Record<string, string> = {
  scenic_spot: "景点", facility: "设施", service: "服务", other: "其他",
}

export function POIManageContent() {
  const pois = useContentPOIStore((s) => s.pois)
  const addPOI = useContentPOIStore((s) => s.addPOI)
  const updatePOI = useContentPOIStore((s) => s.updatePOI)
  const deletePOI = useContentPOIStore((s) => s.deletePOI)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", category: "scenic_spot", address: "", lat: 0, lng: 0 })

  const filtered = search.trim() ? pois.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())) : pois
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "scenic_spot", address: "", lat: 26.87, lng: 100.23 }); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, category: item.category, address: item.address || "", lat: item.lat || 0, lng: item.lng || 0 }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入点位名称"); return }
    if (editing) {
      updatePOI(editing.id, form)
      toast.success("POI已更新")
    } else {
      addPOI({ id: `poi_${Date.now()}`, ...form } as any)
      toast.success("POI已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索点位名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增POI</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>点位名称</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>坐标</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs">{CATEGORY_LABELS[item.category] || item.category}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.address}</TableCell>
              <TableCell className="text-xs text-muted-foreground font-mono">{item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deletePOI(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无POI</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑POI" : "新增POI"}</DialogTitle><DialogDescription>填写地图点位信息</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">点位名称</label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">分类</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary">
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
              <div><label className="block text-sm text-muted-foreground mb-1">地址</label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="h-9" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">纬度</label><Input type="number" step="0.0001" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: Number(e.target.value) }))} className="h-9" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">经度</label><Input type="number" step="0.0001" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: Number(e.target.value) }))} className="h-9" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}