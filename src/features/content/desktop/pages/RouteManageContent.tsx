import { useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useContentGuideStore } from "../../../../platform/content/guide-store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

export function RouteManageContent() {
  const guides = useContentGuideStore((s) => s.guides)
  const addGuide = useContentGuideStore((s) => s.addGuide)
  const updateGuide = useContentGuideStore((s) => s.updateGuide)
  const deleteGuide = useContentGuideStore((s) => s.deleteGuide)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", duration: "", distance: "", description: "", cover: "", stops: 0 })

  const filtered = search.trim() ? guides.filter((g) => g.name.toLowerCase().includes(search.toLowerCase())) : guides
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ name: "", duration: "", distance: "", description: "", cover: "", stops: 0 }); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, duration: item.duration, distance: item.distance, description: item.description, cover: item.cover, stops: item.stops || 0 }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入路线名称"); return }
    if (editing) {
      updateGuide(editing.id, { ...form, tags: editing.tags, spotNames: editing.spotNames, spots: editing.spots })
      toast.success("路线已更新")
    } else {
      addGuide({ id: `route_${Date.now()}`, ...form, tags: [], spotNames: [], spots: [], difficulty: "中等" } as any)
      toast.success("路线已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索路线名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增路线</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>路线名称</TableHead>
            <TableHead>时长</TableHead>
            <TableHead>距离</TableHead>
            <TableHead>途经点</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium max-w-[240px] truncate">{item.name}</TableCell>
              <TableCell className="text-sm">{item.duration}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{item.distance}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {item.spotNames?.slice(0, 3).map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                  {(item.spotNames?.length || 0) > 3 && <span className="text-[10px] text-muted-foreground">+{item.spotNames!.length - 3}</span>}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deleteGuide(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无路线</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑路线" : "新增路线"}</DialogTitle><DialogDescription>填写路线信息</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">路线名称</label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">时长</label><Input value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} className="h-9" placeholder="如：2小时" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">距离</label><Input value={form.distance} onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))} className="h-9" placeholder="如：1.5km" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">途经点</label><Input type="number" value={form.stops} onChange={(e) => setForm((f) => ({ ...f, stops: Number(e.target.value) }))} className="h-9" /></div>
            </div>
            <div><label className="block text-sm text-muted-foreground mb-1">封面图URL</label><Input value={form.cover} onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))} className="h-9" placeholder="https://..." /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">简介</label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}