import { useState, useRef } from "react"
import { useHomepageConfigStore } from "../../../features/homepage/store"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Input } from "../../../shared/components/ui/input"
import { Label } from "../../../shared/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { ConfirmDialog } from "../../components/common/ConfirmDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Eye, Pencil, Plus, Trash2, ChevronUp, ChevronDown, EyeOff, Upload, X } from "lucide-react"
import { toast } from "sonner"
import type { BannerConfig } from "../../../shared/types"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function BannerManagePage() {
  const banners = useHomepageConfigStore((s) => s.banners)
  const addBanner = useHomepageConfigStore((s) => s.addBanner)
  const updateBanner = useHomepageConfigStore((s) => s.updateBanner)
  const removeBanner = useHomepageConfigStore((s) => s.removeBanner)
  const moveBanner = useHomepageConfigStore((s) => s.moveBanner)

  const homeBanners = banners.filter((b) => b.scene === "home").sort((a, b) => a.order - b.order)
  const [editTarget, setEditTarget] = useState<BannerConfig | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BannerConfig | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAdd = () => {
    if (homeBanners.length >= 5) {
      toast.error("最多支持 5 个 Banner")
      return
    }
    const newId = `banner-new-${Date.now()}`
    const newBanner: BannerConfig = {
      id: newId,
      scene: "home",
      imageUrl: "",
      title: "",
      subtitle: "",
      badge: "",
      link: "",
      order: homeBanners.length > 0 ? Math.max(...homeBanners.map((b) => b.order)) + 1 : 0,
      visible: true,
    }
    setEditTarget(newBanner)
  }

  const handleEdit = (banner: BannerConfig) => {
    setEditTarget({ ...banner })
  }

  const handleSave = () => {
    if (!editTarget) return
    if (!editTarget.title.trim() && !editTarget.imageUrl) {
      toast.error("标题和图片至少填写一项")
      return
    }
    const isNew = editTarget.id.startsWith("banner-new-")
    const targetId = isNew ? addBanner("home") : editTarget.id
    updateBanner(targetId, {
      title: editTarget.title,
      subtitle: editTarget.subtitle,
      badge: editTarget.badge,
      imageUrl: editTarget.imageUrl,
      link: editTarget.link,
      visible: editTarget.visible,
    })
    setEditTarget(null)
    toast.success(isNew ? "Banner 已新增" : "Banner 已更新")
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    removeBanner(deleteTarget.id)
    toast.success("Banner 已删除")
    setDeleteTarget(null)
  }

  const toggleVisibility = (banner: BannerConfig) => {
    updateBanner(banner.id, { visible: !banner.visible })
    toast.success(banner.visible ? "已隐藏" : "已显示")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, banner: BannerConfig) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("仅支持 JPG、PNG、WebP 格式")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("图片大小不能超过 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      updateBanner(banner.id, { imageUrl: base64 })
      toast.success("图片已更新")
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const handleDialogFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editTarget) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("仅支持 JPG、PNG、WebP 格式")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("图片大小不能超过 2MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      setEditTarget({ ...editTarget, imageUrl: base64 })
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  return (
    <PageLayout
      title="Banner管理"
      description="管理小程序首页轮播图，支持新增、编辑、排序和显隐控制"
      actions={
        <Button size="sm" onClick={handleAdd} disabled={homeBanners.length >= 5}>
          <Plus className="size-3.5 mr-1" />
          新增 Banner
        </Button>
      }
    >
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>预览</TableHead>
              <TableHead>标题</TableHead>
              <TableHead>副标题</TableHead>
              <TableHead>徽章</TableHead>
              <TableHead>跳转链接</TableHead>
              <TableHead>显示</TableHead>
              <TableHead>排序</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {homeBanners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  暂无 Banner
                </TableCell>
              </TableRow>
            ) : (
              homeBanners.map((banner) => {
                const index = homeBanners.findIndex((b) => b.id === banner.id)
                return (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <div className="size-16 rounded-md bg-slate-100 overflow-hidden relative">
                        {banner.imageUrl ? (
                          <>
                            <img src={banner.imageUrl} alt={banner.title} className="size-full object-cover" />
                            <label className="absolute inset-0 cursor-pointer opacity-0 hover:opacity-100 bg-black/40 flex items-center justify-center transition-opacity">
                              <Upload size={16} className="text-white" />
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, banner)}
                              />
                            </label>
                          </>
                        ) : (
                          <label className="size-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
                            <Upload size={16} className="text-muted-foreground mb-1" />
                            <span className="text-[10px] text-muted-foreground">上传图片</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.webp"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, banner)}
                            />
                          </label>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{banner.title}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">{banner.subtitle}</TableCell>
                    <TableCell>{banner.badge && <Badge variant="secondary">{banner.badge}</Badge>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                      {banner.link}
                    </TableCell>
                    <TableCell>
                      <Badge variant={banner.visible ? "secondary" : "outline"}>
                        {banner.visible ? "显示" : "隐藏"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20"
                          disabled={index === 0}
                          onClick={() => moveBanner(banner.id, -1)}
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <span className="text-xs text-muted-foreground w-4 text-center">{index + 1}</span>
                        <button
                          className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20"
                          disabled={index === homeBanners.length - 1}
                          onClick={() => moveBanner(banner.id, 1)}
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="编辑"
                        onClick={() => handleEdit(banner)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title={banner.visible ? "隐藏" : "显示"}
                        onClick={() => toggleVisibility(banner)}
                      >
                        <EyeOff className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600"
                        title="删除"
                        onClick={() => setDeleteTarget(banner)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-3">
        {homeBanners.length}/5 个 Banner · 支持 JPG/PNG/WebP，单张不超过 2MB
      </div>

      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editTarget?.id.startsWith("banner-new-") ? "新增 Banner" : "编辑 Banner"}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Banner 图片</Label>
                <div className="flex items-start gap-3">
                  <div className="relative w-48 h-28 rounded-md overflow-hidden border bg-slate-50 shrink-0">
                    {editTarget.imageUrl ? (
                      <>
                        <img src={editTarget.imageUrl} alt="preview" className="size-full object-cover" />
                        <button
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                          onClick={() => setEditTarget({ ...editTarget, imageUrl: "" })}
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                        <Upload size={20} />
                        <span className="text-[10px] mt-1">暂无图片</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={handleDialogFileUpload}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="mb-2">
                      <Upload size={14} className="mr-1" />
                      重新上传图片
                    </Button>
                    <p className="text-xs text-muted-foreground">支持 JPG、PNG、WebP，不超过 2MB</p>
                    <p className="text-xs text-muted-foreground">建议尺寸比例 16:7</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>标题</Label>
                  <Input
                    value={editTarget.title}
                    onChange={(e) => setEditTarget({ ...editTarget, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>副标题</Label>
                  <Input
                    value={editTarget.subtitle}
                    onChange={(e) => setEditTarget({ ...editTarget, subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>徽章</Label>
                  <Input
                    value={editTarget.badge}
                    onChange={(e) => setEditTarget({ ...editTarget, badge: e.target.value })}
                    placeholder="如：热门、NEW"
                  />
                </div>
                <div className="space-y-2">
                  <Label>跳转链接</Label>
                  <Input
                    value={editTarget.link}
                    onChange={(e) => setEditTarget({ ...editTarget, link: e.target.value })}
                    placeholder="/c/services"
                  />
                </div>
                <div className="space-y-2">
                  <Label>显示状态</Label>
                  <select
                    className="h-9 w-full rounded-md border bg-input-background px-3 text-sm"
                    value={editTarget.visible ? "true" : "false"}
                    onChange={(e) => setEditTarget({ ...editTarget, visible: e.target.value === "true" })}
                  >
                    <option value="true">显示</option>
                    <option value="false">隐藏</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description={deleteTarget ? `删除后首页不再展示"${deleteTarget.title}"。` : ""}
        onConfirm={handleDelete}
        confirmText="删除"
      />
    </PageLayout>
  )
}
