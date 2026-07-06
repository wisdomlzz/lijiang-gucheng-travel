import { useState } from "react"
import { Card } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useContentMerchantStore } from "../../../../features/content/store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search, Star } from "lucide-react"
import { toast } from "sonner"

const CATEGORY_COLORS: Record<string, string> = {
  餐饮: "#F59E0B", 客栈: "#3B82F6", 购物: "#10B981", 文化: "#8B5CF6", 酒吧: "#EC4899",
}

const CATEGORIES = ["餐饮", "客栈", "购物", "文化", "酒吧"]

export function MerchantManageContent() {
  const merchants = useContentMerchantStore((s) => s.merchants)
  const addMerchant = useContentMerchantStore((s) => s.addMerchant)
  const updateMerchant = useContentMerchantStore((s) => s.updateMerchant)
  const deleteMerchant = useContentMerchantStore((s) => s.deleteMerchant)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: "", category: "餐饮", address: "", phone: "", description: "" })

  const filtered = search.trim() ? merchants.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())) : merchants
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ name: "", category: "餐饮", address: "", phone: "", description: "" }); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, category: item.category || "餐饮", address: item.address || "", phone: item.phone || "", description: item.description || "" }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error("请输入商户名称"); return }
    if (editing) {
      updateMerchant(editing.id, form)
      toast.success("商户已更新")
    } else {
      addMerchant({ id: `m_${Date.now()}`, ...form } as any)
      toast.success("商户已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索商户名称..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增商户</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商户名称</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>电话</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <Badge className="text-xs text-white" style={{ background: CATEGORY_COLORS[item.category] || "#64748B" }}>
                  {item.category}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.address}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.phone || "-"}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deleteMerchant(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无商户</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑商户" : "新增商户"}</DialogTitle><DialogDescription>填写商户信息</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">商户名称</label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">分类</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary">
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div><label className="block text-sm text-muted-foreground mb-1">电话</label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="h-9" /></div>
            </div>
            <div><label className="block text-sm text-muted-foreground mb-1">地址</label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="h-9" /></div>
            <div><label className="block text-sm text-muted-foreground mb-1">描述</label><Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-9" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}