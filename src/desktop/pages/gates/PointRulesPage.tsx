import { useState } from "react"
import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { Badge } from "../../../shared/components/ui/badge"
import { Input } from "../../../shared/components/ui/input"
import { Label } from "../../../shared/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../shared/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table"
import { Switch } from "../../../shared/components/ui/switch"
import { Plus, Settings2, TrendingUp, TrendingDown, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { usePointsStore, type PointRule } from "../../../shared/services/points"

export function PointRulesPage() {
  const rules = usePointsStore((s) => s.rules)
  const addRule = usePointsStore((s) => s.addRule)
  const updateRule = usePointsStore((s) => s.updateRule)
  const removeRule = usePointsStore((s) => s.removeRule)

  const [editing, setEditing] = useState<PointRule | null>(null)
  const [creating, setCreating] = useState(false)

  const blank: PointRule = { code: "", label: "", points: 1, direction: "IN", enabled: true }
  const [form, setForm] = useState<PointRule>(blank)

  const openCreate = () => { setForm(blank); setCreating(true) }
  const openEdit = (r: PointRule) => { setForm(r); setEditing(r) }

  const save = () => {
    if (!form.code || !form.label) { toast.error("编码和名称必填"); return }
    if (editing) { updateRule(editing.code, form); toast.success("规则已更新") }
    else { addRule(form); toast.success("规则已新增") }
    setEditing(null); setCreating(false)
  }

  return (
    <PageLayout title="积分规则配置" description="配置各场景的积分策略，新增来源不改核心逻辑（账户+流水+规则三件套）">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[13px] text-text-secondary">
          <Settings2 size={15} /> 共 {rules.length} 条规则
          <Badge variant="secondary" className="ml-2">IN {rules.filter((r) => r.direction === "IN").length}</Badge>
          <Badge variant="secondary">OUT {rules.filter((r) => r.direction === "OUT").length}</Badge>
        </div>
        <Button onClick={openCreate} size="sm"><Plus size={15} className="mr-1" /> 新增规则</Button>
      </div>

      <div className="bg-white rounded-lg border border-border-light overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>场景编码</TableHead>
              <TableHead>名称</TableHead>
              <TableHead>方向</TableHead>
              <TableHead>基础分值</TableHead>
              <TableHead>每日上限</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.code}>
                <TableCell><code className="text-[12px] bg-gray-50 px-1.5 py-0.5 rounded">{r.code}</code></TableCell>
                <TableCell className="font-medium">{r.label}</TableCell>
                <TableCell>
                  <Badge variant={r.direction === "IN" ? "default" : "secondary"} className="gap-1">
                    {r.direction === "IN" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {r.direction === "IN" ? "赚取" : "消耗"}
                  </Badge>
                </TableCell>
                <TableCell>{r.direction === "IN" ? "+" : "-"}{r.points}</TableCell>
                <TableCell>{r.dailyLimit ?? "—"}</TableCell>
                <TableCell>
                  <Switch checked={r.enabled} onCheckedChange={(v) => updateRule(r.code, { enabled: v })} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { removeRule(r.code); toast.success("已删除") }}><Trash2 size={14} className="text-rose-500" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "编辑规则" : "新增规则"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>场景编码（唯一，英文下划线）</Label>
              <Input value={form.code} disabled={!!editing} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="如 mall_purchase" />
            </div>
            <div>
              <Label>展示名称</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="如 商城消费" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>方向</Label>
                <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "IN" | "OUT" })}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-[13px]">
                  <option value="IN">赚取（IN）</option>
                  <option value="OUT">消耗（OUT）</option>
                </select>
              </div>
              <div>
                <Label>基础分值</Label>
                <Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label>每日上限（0 或留空 = 不限）</Label>
              <Input type="number" value={form.dailyLimit ?? 0} onChange={(e) => setForm({ ...form, dailyLimit: Number(e.target.value) || undefined })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null) }}>取消</Button>
            <Button onClick={save}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}
