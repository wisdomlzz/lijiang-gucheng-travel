import { useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { useContentNewsStore } from "../../../../features/content/store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"
import type { NewsItem, NewsCategory } from "../../../../shared/types/content-types"

const CATEGORIES: NewsCategory[] = ["公房公告", "房屋信息", "举贤纳仕", "其它"]
const TAG_COLORS = ["#3B82F6", "#10B981", "#64748B", "#F59E0B", "#8B5CF6"]

export function NewsManageContent() {
  const news = useContentNewsStore((s) => s.news)
  const addNews = useContentNewsStore((s) => s.addNews)
  const updateNews = useContentNewsStore((s) => s.updateNews)
  const deleteNews = useContentNewsStore((s) => s.deleteNews)

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [form, setForm] = useState({ title: "", summary: "", category: "其它" as NewsCategory, tag: "", imageUrl: "", date: "" })

  const filtered = search.trim()
    ? news.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : news
  const pagination = usePagination(filtered, 10)

  const openAdd = () => { setEditing(null); setForm({ title: "", summary: "", category: "其它", tag: "", imageUrl: "", date: new Date().toISOString().slice(0, 10) }); setDialogOpen(true) }
  const openEdit = (item: NewsItem) => { setEditing(item); setForm({ title: item.title, summary: item.summary, category: item.category, tag: item.tag, imageUrl: item.imageUrl, date: item.date }); setDialogOpen(true) }

  const handleSave = () => {
    if (!form.title.trim()) { toast.error("请输入标题"); return }
    if (editing) {
      updateNews(editing.id, { ...form, tagColor: TAG_COLORS[CATEGORIES.indexOf(form.category)] || TAG_COLORS[0] })
      toast.success("资讯已更新")
    } else {
      addNews({ id: `news_${Date.now()}`, ...form, tagColor: TAG_COLORS[CATEGORIES.indexOf(form.category)] || TAG_COLORS[0] })
      toast.success("资讯已添加")
    }
    setDialogOpen(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="搜索标题..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="size-4 mr-1" />新增资讯</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>标题</TableHead>
            <TableHead>分类</TableHead>
            <TableHead>标签</TableHead>
            <TableHead>日期</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagination.paginatedItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium max-w-[260px] truncate">{item.title}</TableCell>
              <TableCell><Badge variant="secondary" className="text-xs">{item.category}</Badge></TableCell>
              <TableCell><Badge style={{ background: item.tagColor }} className="text-xs text-white">{item.tag}</Badge></TableCell>
              <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(item)}><Pencil className="size-3.5" /></Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { deleteNews(item.id); toast.success("已删除") }}><Trash2 className="size-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">暂无资讯</TableCell></TableRow>}
        </TableBody>
      </Table>
      <div className="mt-3 border-t pt-3"><PaginationBar page={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={pagination.setCurrentPage} pageSize={10} onPageSizeChange={() => {}} total={pagination.total} /></div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "编辑资讯" : "新增资讯"}</DialogTitle><DialogDescription>填写资讯内容</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div><label className="block text-sm text-muted-foreground mb-1">标题</label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">分类</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as NewsCategory }))} className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary">
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div><label className="block text-sm text-muted-foreground mb-1">标签</label><Input value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} className="h-9" placeholder="如：热门活动" /></div>
            </div>
            <div><label className="block text-sm text-muted-foreground mb-1">摘要</label><Input value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-muted-foreground mb-1">图片URL</label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} className="h-9" /></div>
              <div><label className="block text-sm text-muted-foreground mb-1">日期</label><Input value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="h-9" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button><Button onClick={handleSave}>{editing ? "保存" : "添加"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}