import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, Globe2, MonitorSmartphone, Pencil, Plus, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/components/ui/select";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Switch } from "../../../shared/components/ui/switch";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { PageLayout } from "../../components/common/PageLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../shared/components/ui/table";

type LegacyVariant =
  | "article"
  | "company"
  | "popup"
  | "merchantAudit"
  | "convenienceAudit"
  | "journal"
  | "video"
  | "route";

export type LegacyMaintenanceItem = {
  id: string;
  title: string;
  category?: string;
  applicant?: string;
  phone?: string;
  address?: string;
  author?: string;
  sort?: string;
  status: string;
  createdAt: string;
  summary?: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  fileName?: string;
  linkType?: string;
  linkUrl?: string;
  price?: string;
  agency?: string;
  tags?: string;
  transport?: string;
  spotCount?: string;
  duration?: string;
};

type LegacyMaintenancePageProps = {
  title: string;
  description: string;
  variant?: LegacyVariant;
  searchPlaceholder?: string;
  initialRows?: LegacyMaintenanceItem[];
};

const blankItem: LegacyMaintenanceItem = {
  id: "",
  title: "",
  category: "",
  applicant: "",
  phone: "",
  address: "",
  author: "",
  sort: "1",
  status: "待审核",
  createdAt: "",
  summary: "",
  content: "",
  imageUrl: "",
  videoUrl: "",
  fileName: "",
  linkType: "小程序",
  linkUrl: "",
  price: "",
  agency: "",
  tags: "",
  transport: "",
  spotCount: "",
  duration: "",
};

const statusOptions: Record<LegacyVariant, string[]> = {
  article: ["待审核", "已发布", "未发布", "审核不通过"],
  company: ["已发布", "未发布"],
  popup: ["启用", "停用"],
  merchantAudit: ["待审核", "已通过", "不通过"],
  convenienceAudit: ["待审核", "已通过", "不通过"],
  journal: ["待审核", "已发布", "未发布", "审核不通过"],
  video: ["待审核", "已发布", "未发布", "审核不通过"],
  route: ["待审核", "已发布", "未发布", "审核不通过"],
};

function formatNow() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function defaultRows(title: string, variant: LegacyVariant): LegacyMaintenanceItem[] {
  if (variant === "merchantAudit") {
    return [
      {
        id: "merchant-audit-1",
        title: "云上纳西手作",
        category: "购物",
        applicant: "和女士",
        phone: "13900001111",
        address: "五一街兴仁上段",
        status: "待审核",
        createdAt: "2026-04-18 10:20",
        imageUrl: "营业执照、门头照已上传",
        content: "小程序端提交的商家入驻信息，审核通过后可进入对应商家信息维护。",
      },
      {
        id: "merchant-audit-2",
        title: "古城小院餐厅",
        category: "餐饮",
        applicant: "赵先生",
        phone: "13800002222",
        address: "七一街八一下段",
        status: "已通过",
        createdAt: "2026-04-16 15:40",
        imageUrl: "资质材料已归档",
        content: "已通过的商家仍支持调整为不通过，保持旧版后台审核口径。",
      },
    ];
  }

  if (variant === "convenienceAudit") {
    return [
      {
        id: "convenience-audit-1",
        title: "光义街老院短租信息",
        category: "房屋信息",
        applicant: "杨女士",
        phone: "13600003333",
        status: "待审核",
        createdAt: "2026-04-19 09:15",
        imageUrl: "房屋图片3张",
        content: "小程序便民信息栏目提交，审核通过后展示在便民信息下。",
      },
      {
        id: "convenience-audit-2",
        title: "古城文创店招聘店员",
        category: "举贤纳仕",
        applicant: "李先生",
        phone: "13700004444",
        status: "已通过",
        createdAt: "2026-04-15 11:30",
        imageUrl: "岗位图片1张",
        content: "招聘信息已通过审核并在小程序展示。",
      },
    ];
  }

  if (variant === "company") {
    return [
      {
        id: "company-1",
        title: "丽江古城保护管理局公司概况",
        sort: "1",
        status: "已发布",
        createdAt: "2026-04-10 09:00",
        content: "公司概况用于官网前端展示，同一时间原则上仅保留一篇发布内容。",
      },
    ];
  }

  if (variant === "popup") {
    return [
      {
        id: "popup-1",
        title: "官网首页弹窗公告",
        linkType: "网页",
        linkUrl: "https://www.ljgc517.com",
        status: "启用",
        createdAt: "2026-04-12 14:30",
        imageUrl: "弹窗图片已上传",
        content: "官网首页弹窗内容，可启用或停用。",
      },
    ];
  }

  return [
    {
      id: `${variant}-1`,
      title: `${title}示例内容`,
      category: variant === "route" ? "精选线路" : variant === "journal" ? "文化期刊" : title,
      author: "运营部",
      sort: "1",
      status: "已发布",
      createdAt: "2026-04-18 10:00",
      summary: `用于演示${title}的列表、审核、发布与多端展示维护。`,
      content: `${title}承接旧版后台图文内容维护口径，包含新建、编辑、删除、审核、检索和排序。`,
      imageUrl: "封面图已上传",
      videoUrl: variant === "video" ? "古城视频.mp4" : "",
      fileName: variant === "journal" ? "文化期刊2026春季刊.pdf" : "",
      duration: variant === "route" ? "2小时" : "",
      price: variant === "route" ? "免费" : "",
      agency: variant === "route" ? "丽江古城运营部" : "",
      phone: variant === "route" ? "0888-5111111" : "",
      tags: variant === "route" ? "热门,文化" : "",
      transport: variant === "route" ? "步行" : "",
      spotCount: variant === "route" ? "6" : "",
    },
    {
      id: `${variant}-2`,
      title: `${title}待审核稿件`,
      category: variant === "route" ? "推荐线路" : title,
      author: "内容编辑",
      sort: "2",
      status: "待审核",
      createdAt: "2026-04-20 16:20",
      summary: `用于演示${title}审核流转。`,
      content: "待审核内容保存后可通过或不通过。",
      imageUrl: "封面图待审核",
      duration: variant === "route" ? "4小时" : "",
      price: variant === "route" ? "128元起" : "",
      agency: variant === "route" ? "合作旅行社" : "",
      phone: variant === "route" ? "0888-5222222" : "",
      tags: variant === "route" ? "深度,研学" : "",
      transport: variant === "route" ? "步行+观光车" : "",
      spotCount: variant === "route" ? "8" : "",
    },
  ];
}

function statusBadgeVariant(status: string) {
  if (["已发布", "已通过", "启用"].includes(status)) return "secondary";
  if (["不通过", "审核不通过", "停用"].includes(status)) return "destructive";
  return "outline";
}

function titleLabel(variant: LegacyVariant) {
  if (variant === "company") return "公司名称";
  if (variant === "popup") return "弹窗标题";
  if (variant === "merchantAudit") return "商家名称";
  if (variant === "route") return "线路名称";
  if (variant === "journal") return "期刊名称";
  return "标题";
}

export function LegacyMaintenancePage({
  title,
  description,
  variant = "article",
  searchPlaceholder,
  initialRows,
}: LegacyMaintenancePageProps) {
  const [items, setItems] = useState<LegacyMaintenanceItem[]>(() => initialRows || defaultRows(title, variant));
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("全部");
  const [mode, setMode] = useState<"create" | "view" | "edit" | null>(null);
  const [form, setForm] = useState<LegacyMaintenanceItem>(blankItem);
  const [deleteTarget, setDeleteTarget] = useState<LegacyMaintenanceItem | null>(null);
  const [grayscaleDialogOpen, setGrayscaleDialogOpen] = useState(false);
  const [grayscale, setGrayscale] = useState({ website: false, miniapp: false });

  const isAudit = variant === "merchantAudit" || variant === "convenienceAudit";
  const statuses = statusOptions[variant];
  const readOnly = mode === "view";
  const label = titleLabel(variant);
  const statusLabel = variant === "company" || variant === "popup" ? "状态" : "审核状态";

  useEffect(() => {
    setItems(initialRows || defaultRows(title, variant));
    setKeyword("");
    setStatus("全部");
    setMode(null);
    setForm(blankItem);
    setDeleteTarget(null);
    setGrayscaleDialogOpen(false);
  }, [initialRows, title, variant]);

  const filteredItems = useMemo(() => {
    const value = keyword.trim();
    return items.filter((item) => {
      const keywordMatched = !value || [
        item.title,
        item.category,
        item.applicant,
        item.phone,
        item.address,
        item.summary,
        item.content,
      ].filter(Boolean).some((field) => field?.includes(value));
      const statusMatched = status === "全部" || item.status === status;
      return keywordMatched && statusMatched;
    });
  }, [items, keyword, status]);

  const setField = (key: keyof LegacyMaintenanceItem, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const openCreate = () => {
    setForm({ ...blankItem, status: statuses[0], sort: String(items.length + 1) });
    setMode("create");
  };

  const openItem = (item: LegacyMaintenanceItem, nextMode: "view" | "edit") => {
    setForm({ ...blankItem, ...item });
    setMode(nextMode);
  };

  const saveItem = () => {
    if (!form.title.trim()) {
      toast.error(`请填写${label}`);
      return;
    }

    if (mode === "create") {
      const nextItem = {
        ...form,
        id: `${variant}-${Date.now()}`,
        title: form.title.trim(),
        createdAt: formatNow(),
      };
      setItems((prev) => {
        const base = variant === "company" && nextItem.status === "已发布"
          ? prev.map((item) => ({ ...item, status: "未发布" }))
          : prev;
        return [nextItem, ...base];
      });
      toast.success("已新增");
    }

    if (mode === "edit") {
      setItems((prev) => prev.map((item) => {
        if (item.id !== form.id) {
          return variant === "company" && form.status === "已发布" ? { ...item, status: "未发布" } : item;
        }
        return { ...item, ...form, title: form.title.trim() };
      }));
      toast.success("已保存");
    }

    setMode(null);
  };

  const deleteItem = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    toast.success("已删除");
    setDeleteTarget(null);
  };

  const updateAuditStatus = (item: LegacyMaintenanceItem, nextStatus: "已通过" | "不通过") => {
    setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: nextStatus } : row));
    toast.success(nextStatus === "已通过" ? "审核已通过" : "已标记不通过");
  };

  const updateGrayscale = (target: "website" | "miniapp", checked: boolean) => {
    setGrayscale((prev) => ({ ...prev, [target]: checked }));
    toast.success(`${target === "website" ? "官网" : "小程序"}页面${checked ? "已置灰" : "已恢复"}`);
  };

  const resetGrayscale = () => {
    setGrayscale({ website: false, miniapp: false });
    toast.success("官网和小程序页面已恢复原状");
  };

  return (
    <PageLayout
      title={title}
      description={description}
      actions={!isAudit ? (
        <div className="flex items-center gap-2">
          {variant === "popup" ? (
            <Button variant="outline" size="sm" onClick={() => setGrayscaleDialogOpen(true)}>
              <MonitorSmartphone className="size-3.5 mr-1" />
              页面置灰
            </Button>
          ) : null}
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-3.5 mr-1" />
            新建
          </Button>
        </div>
      ) : undefined}
    >
      <div className="space-y-3">
        {variant === "popup" ? (
          <div className="grid gap-3 rounded-md border bg-white p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="text-sm font-medium">页面置灰状态</div>
              <div className="mt-1 text-sm text-muted-foreground">可按旧版后台口径临时将官网或小程序页面颜色设置为黑白，关闭后恢复原状。</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={grayscale.website ? "secondary" : "outline"}>官网：{grayscale.website ? "已置灰" : "正常"}</Badge>
              <Badge variant={grayscale.miniapp ? "secondary" : "outline"}>小程序：{grayscale.miniapp ? "已置灰" : "正常"}</Badge>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Input
            className="w-72"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={searchPlaceholder || `搜索${label}/分类/联系电话`}
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部{statusLabel}</SelectItem>
              {statuses.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{label}</TableHead>
                <TableHead>{isAudit ? "类型" : "分类"}</TableHead>
                {isAudit ? <TableHead>提交人/电话</TableHead> : <TableHead>排序/作者</TableHead>}
                <TableHead>{statusLabel}</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.title}</div>
                    {item.summary ? <div className="mt-1 max-w-md truncate text-xs text-muted-foreground">{item.summary}</div> : null}
                  </TableCell>
                  <TableCell>{item.category || "—"}</TableCell>
                  <TableCell>
                    {isAudit ? (
                      <div className="text-sm">
                        <div>{item.applicant || "—"}</div>
                        <div className="text-xs text-muted-foreground">{item.phone || "—"}</div>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <div>排序 {item.sort || "—"}</div>
                        <div className="text-xs text-muted-foreground">{item.author || "—"}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(item.status)}>{item.status}</Badge>
                  </TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="查看" onClick={() => openItem(item, "view")}>
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="编辑" onClick={() => openItem(item, "edit")}>
                        <Pencil size={14} />
                      </Button>
                      {isAudit ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600" title="通过" onClick={() => updateAuditStatus(item, "已通过")}>
                            <CheckCircle2 size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="不通过" onClick={() => updateAuditStatus(item, "不通过")}>
                            <XCircle size={14} />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" title="删除" onClick={() => setDeleteTarget(item)}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">暂无数据</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
        <div className="text-sm text-muted-foreground">共 {filteredItems.length} 条</div>
      </div>

      {mode ? (
      <Dialog open={true} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{mode === "create" ? `新建${title}` : mode === "edit" ? `编辑${title}` : `${title}详情`}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{label} *</Label>
              <Input value={form.title} onChange={(event) => setField("title", event.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>{isAudit ? "类型" : "分类"}</Label>
              <Input value={form.category} onChange={(event) => setField("category", event.target.value)} disabled={readOnly} />
            </div>
            {isAudit ? (
              <>
                <div className="space-y-2">
                  <Label>提交人</Label>
                  <Input value={form.applicant} onChange={(event) => setField("applicant", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>地址</Label>
                  <Input value={form.address} onChange={(event) => setField("address", event.target.value)} disabled={readOnly} />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>排序</Label>
                  <Input value={form.sort} onChange={(event) => setField("sort", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>作者</Label>
                  <Input value={form.author} onChange={(event) => setField("author", event.target.value)} disabled={readOnly} />
                </div>
              </>
            )}
            {variant === "popup" ? (
              <>
                <div className="space-y-2">
                  <Label>跳转类型</Label>
                  <Input value={form.linkType} onChange={(event) => setField("linkType", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>跳转地址</Label>
                  <Input value={form.linkUrl} onChange={(event) => setField("linkUrl", event.target.value)} disabled={readOnly} />
                </div>
              </>
            ) : null}
            {variant === "journal" ? (
              <div className="space-y-2">
                <Label>期刊文件</Label>
                <Input value={form.fileName} onChange={(event) => setField("fileName", event.target.value)} disabled={readOnly} />
              </div>
            ) : null}
            {variant === "video" ? (
              <div className="space-y-2">
                <Label>视频文件</Label>
                <Input value={form.videoUrl} onChange={(event) => setField("videoUrl", event.target.value)} disabled={readOnly} />
              </div>
            ) : null}
            {variant === "route" ? (
              <>
                <div className="space-y-2">
                  <Label>游览总时长</Label>
                  <Input value={form.duration} onChange={(event) => setField("duration", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>交通方式</Label>
                  <Input value={form.transport} onChange={(event) => setField("transport", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>景点个数</Label>
                  <Input value={form.spotCount} onChange={(event) => setField("spotCount", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>价格</Label>
                  <Input value={form.price} onChange={(event) => setField("price", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>旅行社名称</Label>
                  <Input value={form.agency} onChange={(event) => setField("agency", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>电话</Label>
                  <Input value={form.phone} onChange={(event) => setField("phone", event.target.value)} disabled={readOnly} />
                </div>
                <div className="space-y-2">
                  <Label>标签</Label>
                  <Input value={form.tags} onChange={(event) => setField("tags", event.target.value)} disabled={readOnly} />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label>图片/封面</Label>
              <Input value={form.imageUrl} onChange={(event) => setField("imageUrl", event.target.value)} disabled={readOnly} />
            </div>
            <div className="space-y-2">
              <Label>{statusLabel}</Label>
              {readOnly ? (
                <div className="flex h-9 items-center">
                  <Badge variant={statusBadgeVariant(form.status)}>{form.status}</Badge>
                </div>
              ) : (
                <Select value={form.status} onValueChange={(value) => setField("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>摘要/简介</Label>
              <Textarea value={form.summary} onChange={(event) => setField("summary", event.target.value)} disabled={readOnly} rows={2} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>图文内容/详情介绍</Label>
              <Textarea value={form.content} onChange={(event) => setField("content", event.target.value)} disabled={readOnly} rows={5} />
            </div>
          </div>
          <DialogFooter>
            {readOnly ? (
              <>
                <Button variant="outline" onClick={() => setMode(null)}>关闭</Button>
                <Button onClick={() => setMode("edit")}>编辑</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setMode(null)}>取消</Button>
                <Button onClick={saveItem}>保存</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      ) : null}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="确认删除"
        description={deleteTarget ? `确定删除“${deleteTarget.title}”？` : ""}
        onConfirm={deleteItem}
        confirmText="删除"
      />

      {variant === "popup" ? (
        <Dialog open={grayscaleDialogOpen} onOpenChange={setGrayscaleDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>页面置灰</DialogTitle>
              <DialogDescription>设置官网或小程序页面颜色为黑白色，关闭后恢复原状。</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <Globe2 className="size-5 text-blue-600" />
                  <div>
                    <div className="font-medium">官网</div>
                    <div className="text-sm text-muted-foreground">官网弹窗展示侧页面置灰</div>
                  </div>
                </div>
                <Switch checked={grayscale.website} onCheckedChange={(checked) => updateGrayscale("website", checked)} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <MonitorSmartphone className="size-5 text-emerald-600" />
                  <div>
                    <div className="font-medium">小程序</div>
                    <div className="text-sm text-muted-foreground">小程序访问侧页面置灰</div>
                  </div>
                </div>
                <Switch checked={grayscale.miniapp} onCheckedChange={(checked) => updateGrayscale("miniapp", checked)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetGrayscale}>
                <RotateCcw className="mr-1 size-3.5" />
                恢复原状
              </Button>
              <Button onClick={() => setGrayscaleDialogOpen(false)}>完成</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </PageLayout>
  );
}
