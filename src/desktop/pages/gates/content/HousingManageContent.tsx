import { useState } from "react"
import { Card } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useHousingStore } from "../../../../features/housing/store/housing-store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

export function HousingManageContent() {
  const houses = useHousingStore((s) => s.houses)
  const addHouse = useHousingStore((s) => s.addHouse)
  const updateHouse = useHousingStore((s) => s.updateHouse)
  const deleteHouse = useHousingStore((s) => s.deleteHouse)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", addr: "", status: "rented" as "rented" | "idle", areaName: "古城区", meta: "" })

  const filtered = search.trim() ? houses.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()) || h.addr.includes(search)) : houses
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ name: "", addr: "", status: "rented", areaName: "古城区", meta: "" }); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, addr: item.addr, status: item.status, areaName: item.areaName, meta: (item.meta || []).join(", ") }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入公房名称"); return }
    if (editing) {
      updateHouse(editing.id, { ...form, meta: form.meta.split(",").map((s: string) => s.trim()).filter(Boolean), statusText: form.status === "rented" ? "出租" : "未出租" })
      toast.success("公房已更新")
    } else {
      addHouse({ id: Date.now(), ...form, meta: form.meta.split(",").map((s: string) => s.trim()).filter(Boolean), statusText: form.status === "rented" ? "出租" : "未出租", area: "gucheng" })
      toast.success("公房已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索公房名称或地址..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增公房</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>公房名称</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>区域</TableHead>
            <TableHead>信息</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.addr}</TableCell>
              <TableCell>
                <Badge className={item.status === "rented" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}>
                  {item.statusText}
                </Badge>
              </TableCell>
              <TableCell className="text-sm">{item.areaName}</TableCell>
              <TableCell>
                <div className="flex gap-1 flex-wrap">
                  {item.meta?.map((m, i) => <Badge key={i} variant="secondary" className="text-[10px]">{m}</Badge>)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deleteHouse(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无公房</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑公房" : "新增公房"}</DialogTitle><DialogDescription>填写公房信息</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">公房名称</label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">地址</label><Input value={form.addr} onChange={(e) => setForm((f) => ({ ...f, addr: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">状态</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "rented" | "idle" }))} className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary">
                  <option value="rented">出租</option><option value="idle">未出租</option>
                </select>
              </div>
              <div><label className="block text-sm text-muted-foreground mb-1">区域</label>
                <select value={form.areaName} onChange={(e) => setForm((f) => ({ ...f, areaName: e.target.value }))} className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary">
                  <option>古城区</option><option>玉龙县</option><option>永胜县</option>
                </select>
              </div>
            </div>
            <div><label className="block text-sm text-muted-foreground mb-1">信息（逗号分隔）</label><Input value={form.meta} onChange={(e) => setForm((f) => ({ ...f, meta: e.target.value }))} className="h-9" placeholder="如：267.74㎡, 特色食品, 砖木结构" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}