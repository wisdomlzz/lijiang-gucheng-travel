import { useState, useRef } from "react"
import { useAIKnowledgeStore } from "../../features/ai-knowledge/store"
import { Button } from "../../shared/components/ui/button"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../shared/components/ui/dialog"
import { ConfirmDialog } from "../components/common/ConfirmDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/table"
import { Switch } from "../../shared/components/ui/switch"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { usePagination } from "@/shared/hooks/usePagination"
import { Plus, Pencil, Trash2, Upload, Search, Download, X } from "lucide-react"
import { toast } from "sonner"

export function AIKnowledgeBasePage() {
  const items = useAIKnowledgeStore((s) => s.items)
  const addItem = useAIKnowledgeStore((s) => s.addItem)
  const updateItem = useAIKnowledgeStore((s) => s.updateItem)
  const removeItem = useAIKnowledgeStore((s) => s.removeItem)
  const batchImport = useAIKnowledgeStore((s) => s.batchImport)
  const searchStore = useAIKnowledgeStore((s) => s.search)

  const [keyword, setKeyword] = useState("")
  const [editTarget, setEditTarget] = useState<{
    id: string
    question: string
    answer: string
    status: "enabled" | "disabled"
  } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<{ id: string; status: "enabled" | "disabled" } | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = keyword ? searchStore(keyword) : items
  const enabledCount = items.filter((i) => i.status === "enabled").length
  const pagination = usePagination(filtered, 10)

  const templateData = JSON.stringify([{ question: "问题示例？", answer: "答案示例。" }], null, 2)
  const handleDownloadTemplate = () => {
    const blob = new Blob([templateData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "knowledge-import-template.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAdd = () => {
    setEditTarget({ id: "", question: "", answer: "", status: "enabled" })
  }

  const handleEdit = (item: (typeof items)[0]) => {
    setEditTarget({ id: item.id, question: item.question, answer: item.answer, status: item.status })
  }

  const handleSave = () => {
    if (!editTarget) return
    if (!editTarget.question.trim() || !editTarget.answer.trim()) {
      toast.error("问题和答案不能为空")
      return
    }
    if (editTarget.id) {
      updateItem(editTarget.id, { question: editTarget.question, answer: editTarget.answer, status: editTarget.status })
      toast.success("已更新")
    } else {
      addItem(editTarget.question, editTarget.answer)
      toast.success("已添加")
    }
    setEditTarget(null)
  }

  const handleDelete = () => {
    if (!deleteId) return
    removeItem(deleteId)
    toast.success("已删除")
    setDeleteId(null)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setImportText(text)
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importText)
      if (!Array.isArray(data)) {
        toast.error("格式错误：需要 JSON 数组 [{question, answer}, ...]")
        return
      }
      const result = batchImport(data)
      toast.success(`导入完成：成功 ${result.success} 条${result.failed > 0 ? `，失败 ${result.failed} 条` : ""}`)
      setImportOpen(false)
      setImportText("")
    } catch {
      toast.error("JSON 解析失败，请检查格式")
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">AI 知识库</h1>
        <p className="text-sm text-gray-500 mt-1">
          管理 AI 智能咨询的知识内容，共 {items.length} 条，已启用 {enabledCount} 条
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="搜索问题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Upload className="size-4 mr-1.5" />
          批量导入
        </Button>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="size-4 mr-1.5" />
          新增
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30%]">问题</TableHead>
              <TableHead className="w-[40%]">答案</TableHead>
              <TableHead className="w-[10%]">状态</TableHead>
              <TableHead className="w-[10%]">更新</TableHead>
              <TableHead className="w-[10%] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                  {keyword ? "没有匹配的知识条目" : "暂无数据，点击新增或批量导入"}
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium text-sm text-gray-800">{item.question}</TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-md">
                    <div className="group relative">
                      <div className="truncate">{item.answer}</div>
                      {item.answer.length > 80 && (
                        <div className="invisible group-hover:visible absolute z-50 left-0 top-full mt-1 w-96 p-3 bg-white border rounded-lg shadow-lg text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.status === "enabled"}
                      onCheckedChange={(checked) =>
                        setConfirmStatus({ id: item.id, status: checked ? "enabled" : "disabled" })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">{item.updatedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => handleEdit(item)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-red-500 hover:text-red-600"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filtered.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <PaginationBar
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
            pageSize={10}
            onPageSizeChange={() => {}}
            total={pagination.total}
          />
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget?.id ? "编辑知识条目" : "新增知识条目"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>问题</Label>
              <Input
                value={editTarget?.question ?? ""}
                onChange={(e) => setEditTarget((prev) => (prev ? { ...prev, question: e.target.value } : null))}
                placeholder="例如：古城维护费多少钱？"
              />
            </div>
            <div>
              <Label>答案</Label>
              <textarea
                value={editTarget?.answer ?? ""}
                onChange={(e) => setEditTarget((prev) => (prev ? { ...prev, answer: e.target.value } : null))}
                placeholder="请输入回答内容..."
                rows={6}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>
            <div className="flex items-center gap-3">
              <Label className="mb-0">状态</Label>
              <select
                value={editTarget?.status ?? "enabled"}
                onChange={(e) =>
                  setEditTarget((prev) => (prev ? { ...prev, status: e.target.value as "enabled" | "disabled" } : null))
                }
                className="rounded-md border border-gray-200 px-3 py-1.5 text-sm"
              >
                <option value="enabled">已启用</option>
                <option value="disabled">已禁用</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSave}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="确认删除"
        description="确定要删除此知识条目吗？删除后不可恢复。"
        onConfirm={handleDelete}
      />

      {/* Status Confirm */}
      <ConfirmDialog
        open={!!confirmStatus}
        onOpenChange={(v) => !v && setConfirmStatus(null)}
        title="确认修改状态"
        description={`确定要${confirmStatus?.status === "enabled" ? "启用" : "禁用"}此知识条目吗？`}
        onConfirm={() => {
          if (confirmStatus) {
            updateItem(confirmStatus.id, { status: confirmStatus.status })
            setConfirmStatus(null)
          }
        }}
      />

      {/* Batch Import Dialog */}
      <Dialog
        open={importOpen}
        onOpenChange={(v) => {
          setImportOpen(v)
          if (!v) setImportText("")
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>批量导入知识条目</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">
              支持 JSON 数组格式（如{" "}
              <code className="bg-gray-100 px-1 rounded">[&#123;"question":"问","answer":"答"&#125;]</code>）
            </p>
            <button onClick={handleDownloadTemplate} className="text-xs text-primary hover:underline">
              下载导入模板
            </button>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <Download className="size-3.5 mr-1" />
                选择 JSON 文件
              </Button>
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleFileUpload} />
              {importText && (
                <button onClick={() => setImportText("")} className="text-xs text-gray-400 hover:text-red-500">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="或直接粘贴 JSON 内容..."
              rows={10}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleImport} disabled={!importText.trim()}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
