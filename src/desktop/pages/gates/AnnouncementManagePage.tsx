import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Input } from "../../../shared/components/ui/input"
import { Label } from "../../../shared/components/ui/label"
import { Textarea } from "../../../shared/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { ConfirmDialog } from "../../components/common/ConfirmDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Plus, Trash2, Upload, X, Search } from "lucide-react"
import { toast } from "sonner"
import { readFileAsDataURL } from "@/shared/utils/validation"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { useAnnouncementStore, type Announcement } from "../../../features/announcement/store/announcement-store"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

type FilterStatus = "all" | "draft" | "published" | "unpublished"

export function AnnouncementManagePage() {
  const announcements = useAnnouncementStore((s) => s.announcements)
  const addAnnouncement = useAnnouncementStore((s) => s.addAnnouncement)
  const updateAnnouncement = useAnnouncementStore((s) => s.updateAnnouncement)
  const deleteAnnouncement = useAnnouncementStore((s) => s.deleteAnnouncement)
  const publishAnnouncement = useAnnouncementStore((s) => s.publishAnnouncement)
  const unpublishAnnouncement = useAnnouncementStore((s) => s.unpublishAnnouncement)

  const [editTarget, setEditTarget] = useState<Announcement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all")
  const [searchKeyword, setSearchKeyword] = useState("")

  const filteredAnnouncements = announcements
    .filter((a) => filterStatus === "all" || a.status === filterStatus)
    .filter((a) => !searchKeyword || a.title.includes(searchKeyword))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const pagination = usePagination(filteredAnnouncements, 10)

  // 初始化新增数据
  const getDefaultAnnouncement = (): Announcement => ({
    id: "",
    title: "",
    content: "",
    images: [],
    type: "公告",
    status: "draft",
    createdAt: "",
    updatedAt: "",
    publishTime: "",
  })

  const handleAdd = () => {
    setEditTarget(getDefaultAnnouncement())
  }

  const handleEdit = (ann: Announcement) => {
    setEditTarget({ ...ann })
  }

  const handleSave = () => {
    if (!editTarget) return
    if (!editTarget.title.trim()) {
      toast.error("请输入标题")
      return
    }
    if (!editTarget.content.trim()) {
      toast.error("请输入内容")
      return
    }

    const isNew = !editTarget.id

    if (isNew) {
      addAnnouncement({
        title: editTarget.title,
        content: editTarget.content,
        images: editTarget.images,
        type: editTarget.type,
      })
      toast.success("已新增")
    } else {
      updateAnnouncement(editTarget.id, {
        title: editTarget.title,
        content: editTarget.content,
        images: editTarget.images,
        type: editTarget.type,
      })
      toast.success("已更新")
    }
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteAnnouncement(deleteTarget.id)
    toast.success("公告已删除")
    setDeleteTarget(null)
  }

  const handlePublish = (ann: Announcement) => {
    publishAnnouncement(ann.id)
    toast.success("公告已发布")
  }

  const handleUnpublish = (ann: Announcement) => {
    unpublishAnnouncement(ann.id)
    toast.success("公告已下架")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editTarget) return
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

    const result = await readFileAsDataURL(file)
    setEditTarget({ ...editTarget, images: [...editTarget.images, result] })
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    if (!editTarget) return
    setEditTarget({
      ...editTarget,
      images: editTarget.images.filter((_, i) => i !== index),
    })
  }

  const getStatusBadge = (status: Announcement["status"]) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">已发布</Badge>
      case "unpublished":
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">已下架</Badge>
      case "draft":
        return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">草稿</Badge>
    }
  }

  // 格式化日期时间
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "-"
    const date = new Date(isoString)
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <PageLayout
      title="公告下发管理"
      description="管理平台公告通知，支持新增、编辑、发布和下架操作"
      actions={
        <Button size="sm" onClick={handleAdd}>
          <Plus className="size-3.5 mr-1" />
          新增公告
        </Button>
      }
    >
      {/* 搜索与筛选 */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          {[
            { value: "all", label: "全部" },
            { value: "published", label: "已发布" },
            { value: "unpublished", label: "已下架" },
            { value: "draft", label: "草稿" },
          ].map((item) => (
            <Button
              key={item.value}
              variant={filterStatus === item.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(item.value as FilterStatus)}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="搜索标题..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 列表 */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">标题</TableHead>
              <TableHead className="w-[80px]">状态</TableHead>
              <TableHead className="w-[140px]">创建时间</TableHead>
              <TableHead className="w-[150px]">最近一次发布时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAnnouncements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell className="font-medium">{ann.title}</TableCell>
                  <TableCell>{getStatusBadge(ann.status)}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(ann.createdAt)}</TableCell>
                  <TableCell className="text-sm">{formatDateTime(ann.publishTime)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* 草稿状态：显示发布按钮 */}
                      {ann.status === "draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(ann)}
                          className="text-green-600 h-auto p-0"
                        >
                          发布
                        </Button>
                      )}
                      {/* 已发布状态：显示下架按钮 */}
                      {ann.status === "published" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnpublish(ann)}
                          className="text-yellow-600 h-auto p-0"
                        >
                          下架
                        </Button>
                      )}
                      {/* 已下架状态：显示发布按钮 */}
                      {ann.status === "unpublished" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePublish(ann)}
                          className="text-green-600 h-auto p-0"
                        >
                          发布
                        </Button>
                      )}
                      {/* 编辑按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ann)}
                        className="h-auto p-0 text-primary"
                      >
                        编辑
                      </Button>
                      {/* 删除按钮 */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(ann)}
                        className="h-auto p-0 text-red-500"
                      >
                        删除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4">
        <PaginationBar
          page={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          pageSize={10}
          onPageSizeChange={() => {}}
          total={pagination.total}
        />
      </div>

      {/* 新增/编辑弹窗 */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget?.id ? "编辑公告" : "新增公告"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 标题 */}
            <div className="space-y-2">
              <Label>
                标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={editTarget?.title || ""}
                onChange={(e) => setEditTarget(editTarget ? { ...editTarget, title: e.target.value } : null)}
                placeholder="请输入公告标题"
              />
            </div>

            {/* 内容 */}
            <div className="space-y-2">
              <Label>
                内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={editTarget?.content || ""}
                onChange={(e) => setEditTarget(editTarget ? { ...editTarget, content: e.target.value } : null)}
                placeholder="请输入公告内容"
                rows={6}
              />
            </div>

            {/* 图片 */}
            <div className="space-y-2">
              <Label>图片（最多3张）</Label>
              <div className="flex flex-wrap gap-2">
                {editTarget?.images.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-0 right-0 bg-black/50 hover:bg-black/50 p-0.5"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="size-3 text-white" />
                    </Button>
                  </div>
                ))}
                {(!editTarget?.images || editTarget.images.length < 3) && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">上传</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="删除公告"
        description={`确定要删除"${deleteTarget?.title}"吗？此操作不可恢复。`}
        confirmText="删除"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </PageLayout>
  )
}
