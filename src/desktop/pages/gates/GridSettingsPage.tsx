import { useState, useRef } from "react"
import {
  ChevronUp, ChevronDown, EyeOff, Pencil, Upload, X,
} from "lucide-react"
import { useHomepageConfigStore } from "../../../shared/services/homepage"
import type { GridItemConfig } from "../../../shared/types"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Input } from "../../../shared/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { toast } from "sonner"

const MAX_FILE_SIZE = 500 * 1024 // 500KB
const ALLOWED_TYPES = ["image/png", "image/webp"]

const PAGE_SIZE = 8

function GridTable({
  items,
  pageLabel,
  sortedItems,
  onMove,
  onToggle,
  onEdit,
}: {
  items: GridItemConfig[]
  pageLabel: string
  sortedItems: GridItemConfig[]
  onMove: (idx: number, dir: -1 | 1) => void
  onToggle: (id: string) => void
  onEdit: (item: GridItemConfig) => void
}) {
  const visibleItems = items.filter((i) => i.visible)
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-sm font-medium">{pageLabel}</h3>
        <span className="text-xs text-muted-foreground">{visibleItems.length} 个可见</span>
      </div>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">序号</TableHead>
              <TableHead>图片</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>跳转路由</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-24 text-center">顺序</TableHead>
              <TableHead className="text-right w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-12 text-center text-muted-foreground">暂无宫格</TableCell>
              </TableRow>
            ) : (
              items.map((item, localIdx) => {
                const globalIdx = sortedItems.findIndex((s) => s.id === item.id)
                return (
                  <TableRow key={item.id} className={item.visible ? "" : "opacity-40"}>
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground">{globalIdx + 1}</span>
                    </TableCell>
                    <TableCell>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 ring-1 ring-slate-200 hover:ring-primary/40 hover:scale-110 transition-all cursor-pointer" title={item.label}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] text-muted-foreground">无图</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{item.route}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={item.visible ? "secondary" : "outline"}>{item.visible ? "显示" : "隐藏"}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed"
                          disabled={globalIdx === 0}
                          onClick={() => onMove(globalIdx, -1)}
                          title="上移"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed"
                          disabled={globalIdx === sortedItems.length - 1}
                          onClick={() => onMove(globalIdx, 1)}
                          title="下移"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑名称和图片" onClick={() => onEdit(item)}>
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title={item.visible ? "隐藏" : "显示"} onClick={() => onToggle(item.id)}>
                          <EyeOff className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function GridSettingsPage() {
  const gridItems = useHomepageConfigStore((s) => s.gridItems)
  const toggleGridItem = useHomepageConfigStore((s) => s.toggleGridItem)
  const reorderGridItem = useHomepageConfigStore((s) => s.reorderGridItem)
  const updateGridItem = useHomepageConfigStore((s) => s.updateGridItem)
  const [editId, setEditId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")
  const [editImageUrl, setEditImageUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const visibleItems = gridItems.filter((item) => item.visible)
  const hiddenItems = gridItems.filter((item) => !item.visible)

  const sortedItems = [...gridItems].sort((a, b) => a.order - b.order)
  const page1Items = sortedItems.slice(0, PAGE_SIZE)
  const page2Items = sortedItems.slice(PAGE_SIZE, PAGE_SIZE * 2)
  const page3Items = sortedItems.slice(PAGE_SIZE * 2)
  const hasPage2 = page2Items.length > 0
  const hasPage3 = page3Items.length > 0
  const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE))

  const handleMove = (globalIdx: number, direction: -1 | 1) => {
    const targetIdx = globalIdx + direction
    if (targetIdx < 0 || targetIdx >= sortedItems.length) return
    const itemA = sortedItems[globalIdx]
    const itemB = sortedItems[targetIdx]
    const idxA = gridItems.findIndex((g) => g.id === itemA.id)
    const idxB = gridItems.findIndex((g) => g.id === itemB.id)
    reorderGridItem(idxA, idxB)
  }

  const handleToggle = (id: string) => {
    const item = gridItems.find((i) => i.id === id)
    toggleGridItem(id)
    toast.success(item?.visible ? "已隐藏" : "已显示")
  }

  const openEdit = (item: typeof gridItems[0]) => {
    setEditId(item.id)
    setEditLabel(item.label)
    setEditImageUrl(item.imageUrl)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("仅支持 PNG、WebP 格式")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("图片大小不能超过 500KB")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setEditImageUrl(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const saveEdit = () => {
    if (!editId || !editLabel.trim()) return
    updateGridItem(editId, { label: editLabel.trim(), imageUrl: editImageUrl })
    toast.success("已保存")
    setEditId(null)
  }

  const editingItem = editId ? gridItems.find((i) => i.id === editId) : null

  return (
    <PageLayout
      title="首页宫格管理"
      description="C端宫格按 order 顺序自动分页（每8个为一页），上移/下移在全局列表内调整顺序。"
    >
      <div className="space-y-6">
        <GridTable
          items={page1Items}
          pageLabel={`第 1 页（共 ${totalPages} 页）`}
          sortedItems={sortedItems}
          onMove={handleMove}
          onToggle={handleToggle}
          onEdit={openEdit}
        />

        {hasPage2 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px border-t border-dashed border-slate-300" />
              <span className="text-xs text-muted-foreground">第 2 页</span>
              <div className="flex-1 h-px border-t border-dashed border-slate-300" />
            </div>
            <GridTable
              items={page2Items}
              pageLabel="第 2 页"
              sortedItems={sortedItems}
              onMove={handleMove}
              onToggle={handleToggle}
              onEdit={openEdit}
            />
          </>
        )}

        {hasPage3 && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px border-t border-dashed border-slate-300" />
              <span className="text-xs text-muted-foreground">第 3 页</span>
              <div className="flex-1 h-px border-t border-dashed border-slate-300" />
            </div>
            <GridTable
              items={page3Items}
              pageLabel="第 3 页"
              sortedItems={sortedItems}
              onMove={handleMove}
              onToggle={handleToggle}
              onEdit={openEdit}
            />
          </>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共 {gridItems.length} 个宫格 · 显示 {visibleItems.length} 个 · 隐藏 {hiddenItems.length} 个</span>
          <span>C端自动分页：第 1 页 {page1Items.filter((i) => i.visible).length} 个 · 第 2 页 {page2Items.filter((i) => i.visible).length} 个{hasPage3 ? ` · 第 3 页 ${page3Items.filter((i) => i.visible).length} 个` : ""}</span>
        </div>
      </div>

      <Dialog open={!!editId} onOpenChange={(open) => { if (!open) setEditId(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑宫格</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">宫格名称</label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="请输入宫格名称"
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">最多8个字符</p>
            </div>
            {editingItem && (
              <div className="rounded-lg border bg-slate-50 p-3 flex items-center gap-3">
                <div className="text-xs text-muted-foreground">
                  <div>当前路由：<span className="font-mono">{editingItem.route}</span></div>
                  <div className="text-[10px] mt-0.5 text-amber-600">路由不可修改</div>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">宫格图片</label>
              <div className="flex items-start gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.webp"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50/80 hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer shrink-0 group"
                >
                  {editImageUrl ? (
                    <>
                      <img src={editImageUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <button
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setEditImageUrl("") }}
                      >
                        <X size={12} />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                      <Upload size={20} />
                      <span className="text-[10px] mt-1">点击上传</span>
                    </div>
                  )}
                </button>
                <div className="flex-1 pt-1">
                  <p className="text-sm text-foreground">点击左侧区域选择图片</p>
                  <p className="text-xs text-muted-foreground mt-1">支持 PNG、WebP 格式</p>
                  <p className="text-xs text-muted-foreground">文件大小不超过 500KB</p>
                  <p className="text-xs text-muted-foreground mt-2">建议尺寸 120×120px</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditId(null)}>取消</Button>
            <Button onClick={saveEdit} disabled={!editLabel.trim()}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
