import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useRulesStore, useTrustScoreStore } from "../../store"
import type { ScoreRule } from "../../store/rules-store"
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

export default function TrustScoreConfigPage() {
  const rules = useRulesStore((s) => s.rules)
  const threshold = useRulesStore((s) => s.threshold)
  const addRule = useRulesStore((s) => s.addRule)
  const updateRule = useRulesStore((s) => s.updateRule)
  const removeRule = useRulesStore((s) => s.removeRule)
  const toggleRule = useRulesStore((s) => s.toggleRule)
  const updateThreshold = useRulesStore((s) => s.updateThreshold)
  const resetThreshold = useRulesStore((s) => s.resetThreshold)
  const resetRules = useRulesStore((s) => s.resetRules)

  const scores = useTrustScoreStore((s) => s.scores)

  // Rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<ScoreRule | null>(null)
  const [ruleForm, setRuleForm] = useState({
    type: "deduct" as "deduct" | "reward",
    name: "",
    condition: "",
    scoreChange: 0,
    description: "",
    enabled: true,
  })

  // Threshold edit state
  const [thresholdForm, setThresholdForm] = useState({ ...threshold })
  const [thresholdDirty, setThresholdDirty] = useState(false)

  const deductRules = useMemo(() => rules.filter((r) => r.type === "deduct"), [rules])
  const rewardRules = useMemo(() => rules.filter((r) => r.type === "reward"), [rules])

  const handleOpenAddRule = (type: "deduct" | "reward") => {
    setEditingRule(null)
    setRuleForm({ type, name: "", condition: "", scoreChange: type === "deduct" ? -1 : 1, description: "", enabled: true })
    setRuleDialogOpen(true)
  }

  const handleOpenEditRule = (rule: ScoreRule) => {
    setEditingRule(rule)
    setRuleForm({
      type: rule.type,
      name: rule.name,
      condition: rule.condition,
      scoreChange: rule.scoreChange,
      description: rule.description,
      enabled: rule.enabled,
    })
    setRuleDialogOpen(true)
  }

  const handleSaveRule = () => {
    if (!ruleForm.name.trim()) {
      toast.error("请输入规则名称")
      return
    }
    if (ruleForm.scoreChange === 0) {
      toast.error("分值变化不能为 0")
      return
    }
    if (editingRule) {
      updateRule(editingRule.id, ruleForm)
      toast.success("规则已更新")
    } else {
      addRule(ruleForm)
      toast.success("规则已添加")
    }
    setRuleDialogOpen(false)
  }

  const handleDeleteRule = (id: string, name: string) => {
    removeRule(id)
    toast.success(`已删除规则「${name}」`)
  }

  const handleSaveThreshold = () => {
    updateThreshold(thresholdForm)
    setThresholdDirty(false)
    toast.success("阈值配置已保存")
  }

  const handleResetThreshold = () => {
    resetThreshold()
    setThresholdForm({ ...useRulesStore.getState().threshold })
    setThresholdDirty(false)
    toast.success("已恢复默认阈值")
  }

  return (
    <PageLayout title="诚信评分配置" description="管理诚信评分规则与失信阈值">
      {/* 评分规则 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>评分规则</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleOpenAddRule("deduct")}>
                <Plus className="size-4 mr-1" /> 添加扣分规则
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleOpenAddRule("reward")}>
                <Plus className="size-4 mr-1" /> 添加加分规则
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { resetRules(); toast.success("规则已重置为默认") }}>
                <RotateCcw className="size-4 mr-1" /> 重置
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 扣分规则 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-red-600 mb-3 flex items-center gap-1">
              <AlertTriangle className="size-4" /> 扣分规则
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>触发条件</TableHead>
                  <TableHead>扣分值</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deductRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{rule.condition}</TableCell>
                    <TableCell className="text-red-600 font-medium">{rule.scoreChange}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rule.description}</TableCell>
                    <TableCell>
                      <Badge className={rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                        {rule.enabled ? "已启用" : "已停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRule(rule.id)} title={rule.enabled ? "停用" : "启用"}>
                          {rule.enabled ? <ToggleRight className="size-4 text-emerald-600" /> : <ToggleLeft className="size-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEditRule(rule)} title="编辑">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteRule(rule.id, rule.name)} title="删除">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {deductRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">暂无扣分规则</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 加分规则 */}
          <div>
            <h4 className="text-sm font-medium text-emerald-600 mb-3 flex items-center gap-1">
              <CheckCircle2 className="size-4" /> 加分规则
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>规则名称</TableHead>
                  <TableHead>触发条件</TableHead>
                  <TableHead>加分值</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewardRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell className="text-sm text-text-secondary">{rule.condition}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">+{rule.scoreChange}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{rule.description}</TableCell>
                    <TableCell>
                      <Badge className={rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}>
                        {rule.enabled ? "已启用" : "已停用"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleRule(rule.id)} title={rule.enabled ? "停用" : "启用"}>
                          {rule.enabled ? <ToggleRight className="size-4 text-emerald-600" /> : <ToggleLeft className="size-4 text-gray-400" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleOpenEditRule(rule)} title="编辑">
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDeleteRule(rule.id, rule.name)} title="删除">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rewardRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">暂无加分规则</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 失信阈值配置 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>失信阈值配置</span>
            <div className="flex gap-2">
              {thresholdDirty && (
                <Button size="sm" onClick={handleSaveThreshold}>
                  保存配置
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleResetThreshold}>
                <RotateCcw className="size-4 mr-1" /> 恢复默认
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">初始分值</label>
              <Input
                type="number"
                value={thresholdForm.defaultScore}
                onChange={(e) => {
                  setThresholdForm((f) => ({ ...f, defaultScore: Number(e.target.value) }))
                  setThresholdDirty(true)
                }}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">失信分数线</label>
              <Input
                type="number"
                value={thresholdForm.delinquentThreshold}
                onChange={(e) => {
                  setThresholdForm((f) => ({ ...f, delinquentThreshold: Number(e.target.value) }))
                  setThresholdDirty(true)
                }}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">自动恢复分值</label>
              <Input
                type="number"
                value={thresholdForm.recoverScore}
                onChange={(e) => {
                  setThresholdForm((f) => ({ ...f, recoverScore: Number(e.target.value) }))
                  setThresholdDirty(true)
                }}
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">自动恢复</label>
              <select
                value={thresholdForm.autoRecover ? "true" : "false"}
                onChange={(e) => {
                  setThresholdForm((f) => ({ ...f, autoRecover: e.target.value === "true" }))
                  setThresholdDirty(true)
                }}
                className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary"
              >
                <option value="true">达到分值自动恢复</option>
                <option value="false">需管理员手动恢复</option>
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            低于失信分数线（{thresholdForm.delinquentThreshold}分）的服务人员将自动标记为"失信"状态，
            {thresholdForm.autoRecover
              ? `恢复至 ${thresholdForm.recoverScore} 分以上时自动恢复正常状态。`
              : "需管理员手动恢复为正常状态。"}
          </div>
        </CardContent>
      </Card>

      {/* 服务人员评分快览 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">服务人员评分快览</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>当前评分</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>总订单</TableHead>
                <TableHead>好评数</TableHead>
                <TableHead>差评数</TableHead>
                <TableHead>投诉次数</TableHead>
                <TableHead>拒单次数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map((s) => (
                <TableRow key={s.staffId}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <span
                      className={`font-semibold ${
                        s.trustScore >= thresholdForm.delinquentThreshold ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {s.trustScore}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={s.status === "正常" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{s.totalOrders}</TableCell>
                  <TableCell>{s.rating5Count + s.rating4Count}</TableCell>
                  <TableCell>{s.rating2Count + s.rating1Count}</TableCell>
                  <TableCell>{s.complaintCount}</TableCell>
                  <TableCell>{s.rejectionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 规则编辑/新增弹窗 */}
      <Dialog open={ruleDialogOpen} onOpenChange={(open) => !open && setRuleDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? "编辑规则" : `添加${ruleForm.type === "deduct" ? "扣分" : "加分"}规则`}</DialogTitle>
            <DialogDescription>
              {editingRule ? "修改已有规则的参数" : "新增一条诚信评分规则"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">规则名称</label>
              <Input
                value={ruleForm.name}
                onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：差评扣分"
                className="h-9"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">触发条件</label>
              <Input
                value={ruleForm.condition}
                onChange={(e) => setRuleForm((f) => ({ ...f, condition: e.target.value }))}
                placeholder="例如：用户评价 ≤ 2 星"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  分值变化
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={ruleForm.scoreChange}
                  onChange={(e) => setRuleForm((f) => ({ ...f, scoreChange: Number(e.target.value) }))}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {ruleForm.type === "deduct" ? "扣分为负数" : "加分为正数"}
                </p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">启用状态</label>
                <select
                  value={ruleForm.enabled ? "true" : "false"}
                  onChange={(e) => setRuleForm((f) => ({ ...f, enabled: e.target.value === "true" }))}
                  className="h-9 w-full text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary"
                >
                  <option value="true">已启用</option>
                  <option value="false">已停用</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">说明</label>
              <Input
                value={ruleForm.description}
                onChange={(e) => setRuleForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="规则补充说明"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>取消</Button>
            <Button onClick={handleSaveRule}>{editingRule ? "保存修改" : "添加规则"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}