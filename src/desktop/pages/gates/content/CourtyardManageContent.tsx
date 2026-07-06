import { useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useContentCourtyardStore } from "../../../../features/content/store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

export function CourtyardManageContent() {
  const courtyards = useContentCourtyardStore((s) => s.courtyards)
  const addCourtyard = useContentCourtyardStore((s) => s.addCourtyard)
  const updateCourtyard = useContentCourtyardStore((s) => s.updateCourtyard)
  const deleteCourtyard = useContentCourtyardStore((s) => s.deleteCourtyard)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", location: "", hours: "", description: "", imageUrl: "" })

  const filtered = search.trim() ? courtyards.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : courtyards
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ name: "", location: "", hours: "", description: "", imageUrl: "" }); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, location: item.location, hours: item.hours, description: item.description, imageUrl: item.imageUrl }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入院落名称"); return }
    if (editing) {
      updateCourtyard(editing.id, form)
      toast.success("院落已更新")
    } else {
      addCourtyard({ id: `ct_${Date.now()}`, ...form, tags: [] } as any)
      toast.success("院落已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索院落名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增院落</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>院落名称</TableHead>
            <TableHead>位置</TableHead>
            <TableHead>开放时间</TableHead>
            <TableHead>标签</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">{item.location}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.hours}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {item.tags?.slice(0, 3).map((t: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deleteCourtyard(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无院落</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑院落" : "新增院落"}</DialogTitle><DialogDescription>填写文化院落信息</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">院落名称</label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">位置</label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="h-9" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">开放时间</label><Input value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} className="h-9" placeholder="如：09:00-17:00" /></div>
            </div>
            <div><label className="block text-sm text-muted-foreground mb-1">简介</label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">图片URL</label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}