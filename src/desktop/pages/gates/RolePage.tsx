import { useEffect, useMemo, useState } from "react";
import { Card } from "../../../shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { Label } from "../../../shared/components/ui/label";
import { Checkbox } from "../../../shared/components/ui/checkbox";
import { Input } from "../../../shared/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../shared/components/ui/dialog";
import { PageHeader } from "../../components/common/PageHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  KeyRound, Pencil, Plus, Save, Search, ShieldCheck, Trash2, Users,
} from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "../../../shared/hooks/usePagination";

const PAGE_SIZE = 10;

interface PermModule { id: string; name: string; items: { id: string; label: string }[] }

type AdminRole = { id: string; name: string; description: string };

type AdminAccount = {
  id: string; accountName: string; password: string; phone: string; position: string;
  gender: "男" | "女"; age: number; status: "正常" | "禁用"; roleId: string;
};

const permModules: PermModule[] = [
  { id: "dashboard", name: "工作台", items: [{ id: "view", label: "查看" }] },
  { id: "convenience", name: "便民服务管理", items: [
    { id: "overview", label: "服务概览" }, { id: "dispatch", label: "派单列表" },
    { id: "zones", label: "片区管理" }, { id: "config", label: "派单配置" },
    { id: "staff", label: "服务人员" }, { id: "arbitration", label: "价格仲裁" },
  ] },
  { id: "supplier", name: "商家与供应商", items: [
    { id: "entry", label: "供应商入驻审核" }, { id: "mall", label: "商城管理后台入口" },
  ] },
  { id: "tourist", name: "游客服务", items: [
    { id: "party", label: "党员服务" }, { id: "handwash", label: "洗手台" },
    { id: "service", label: "服务" }, { id: "attractions", label: "景点" },
    { id: "courtyard", label: "文化院落" }, { id: "parking", label: "停车场" },
    { id: "merchant", label: "购物/餐饮/住宿/酒吧" }, { id: "facility", label: "厕所/吸烟区/出入口/应急避难" },
  ] },
  { id: "content", name: "内容管理", items: [
    { id: "news", label: "景区资讯" }, { id: "guides", label: "古城攻略" },
    { id: "serviceCenter", label: "服务中心" }, { id: "policies", label: "政策法规" },
    { id: "protection", label: "保护指南" }, { id: "procedures", label: "办事流程" },
    { id: "culture", label: "文化古城/期刊/视频" }, { id: "routes", label: "精选线路/推荐线路" },
  ] },
  { id: "system", name: "系统管理", items: [
    { id: "accounts", label: "账号管理" }, { id: "roles", label: "角色管理" },
    { id: "company", label: "公司概况" }, { id: "complaintPhone", label: "投诉反馈电话" },
    { id: "website", label: "网站管理" }, { id: "merchantAudit", label: "商家审核" },
    { id: "convenienceAudit", label: "便民服务审核" }, { id: "analytics", label: "访问统计" },
    { id: "ad", label: "广告位维护" },
  ] },
];

const seedRoles: AdminRole[] = [
  { id: "R01", name: "平台管理员", description: "全部后台菜单权限，可维护账号、角色和业务数据" },
  { id: "R02", name: "内容运营", description: "维护游客服务、内容管理、商家信息与审核" },
  { id: "R03", name: "客服受理", description: "处理投诉反馈、便民信息审核和服务回访" },
  { id: "R04", name: "便民服务主管", description: "维护便民服务派单、片区、人员与价格仲裁" },
];

const seedAccounts: AdminAccount[] = [
  { id: "A001", accountName: "admin01", password: "******", phone: "18800003001", position: "平台管理员", gender: "男", age: 36, status: "正常", roleId: "R01" },
  { id: "A002", accountName: "content01", password: "******", phone: "18800003002", position: "内容运营", gender: "女", age: 29, status: "正常", roleId: "R02" },
  { id: "A003", accountName: "service01", password: "******", phone: "18800003003", position: "客服受理", gender: "女", age: 31, status: "正常", roleId: "R03" },
  { id: "A004", accountName: "convenience01", password: "******", phone: "18800003004", position: "便民服务主管", gender: "男", age: 34, status: "禁用", roleId: "R04" },
];

function allPermIds() { return permModules.flatMap((m) => m.items.map((i) => `${m.id}:${i.id}`)); }

function defaultPerms(roleId: string): Set<string> {
  const ids = allPermIds();
  if (roleId === "R01") return new Set(ids);
  if (roleId === "R02") return new Set(ids.filter((p) => p.startsWith("tourist:") || p.startsWith("content:") || p.startsWith("supplier:") || p === "dashboard:view"));
  if (roleId === "R03") return new Set(ids.filter((p) => p === "system:complaintPhone" || p === "system:convenienceAudit" || p === "dashboard:view"));
  if (roleId === "R04") return new Set(ids.filter((p) => p.startsWith("convenience:") || p === "dashboard:view"));
  return new Set(["dashboard:view"]);
}

export default function RolePage() {
  const [roles, setRoles] = useState<AdminRole[]>(seedRoles);
  const [accounts, setAccounts] = useState<AdminAccount[]>(seedAccounts);
  const [perms, setPerms] = useState<Record<string, Set<string>>>(Object.fromEntries(seedRoles.map((r) => [r.id, defaultPerms(r.id)])));
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; role?: AdminRole } | null>(null);
  const [permModal, setPermModal] = useState<string | null>(null);
  const [memberModal, setMemberModal] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);

  const filtered = useMemo(() => roles.filter((r) => !search || r.name.includes(search) || r.description.includes(search)), [search, roles]);
  const { currentPage, setCurrentPage, totalPages, paginatedItems, total: _total } = usePagination(filtered, PAGE_SIZE);
  const memberCount = (rid: string) => accounts.filter((a) => a.roleId === rid).length;
  const permCount = (rid: string) => perms[rid]?.size ?? 0;

  const handleSave = (role: AdminRole) => {
    if (dialog?.mode === "create") {
      const id = `R${String(Date.now()).slice(-3)}`;
      setRoles((p) => [{ ...role, id }, ...p]);
      setPerms((p) => ({ ...p, [id]: defaultPerms(id) }));
      toast.success("角色已新建");
    } else {
      setRoles((p) => p.map((i) => (i.id === role.id ? role : i)));
      toast.success("角色已更新");
    }
    setDialog(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const fallback = roles.find((r) => r.id !== deleteTarget.id)?.id;
    setRoles((p) => p.filter((r) => r.id !== deleteTarget.id));
    setAccounts((p) => p.map((a) => (a.roleId === deleteTarget.id && fallback ? { ...a, roleId: fallback } : a)));
    setPerms((p) => { const n = { ...p }; delete n[deleteTarget.id]; return n; });
    toast.success("角色已删除，相关账号已转入其他角色");
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="角色管理"
        desc="复用旧版后台系统管理：角色权限配置和菜单级授权"
        actions={
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setDialog({ mode: "create" })}>
            <Plus className="size-3.5 mr-1" />新建角色
          </Button>
        }
      />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="角色名称 / 角色描述" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex-1" />
          <Badge variant="secondary">共 {filtered.length} 个角色</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>角色编号</TableHead>
              <TableHead>角色名称</TableHead>
              <TableHead>角色描述</TableHead>
              <TableHead className="text-right">用户数</TableHead>
              <TableHead className="text-right">菜单权限</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.id}</TableCell>
                <TableCell className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-600" />{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.description}</TableCell>
                <TableCell className="text-right">{memberCount(r.id)}</TableCell>
                <TableCell className="text-right">{permCount(r.id)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => setPermModal(r.id)}>权限配置</Button>
                  <Button size="sm" variant="ghost" onClick={() => setMemberModal(r.id)}>成员管理</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", role: r })}>
                    <Pencil className="size-3.5 mr-1" />编辑
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(r)}>
                    <Trash2 className="size-3.5 mr-1" />删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无角色</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <span className="text-sm text-muted-foreground">
            显示第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)} className="h-9 rounded-lg">上一页</Button>
            <span className="text-sm px-2"><span className="font-semibold">{currentPage}</span> / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="h-9 rounded-lg">下一页</Button>
          </div>
        </div>
      )}

      <RoleDialog open={!!dialog} mode={dialog?.mode ?? "create"} role={dialog?.role} onClose={() => setDialog(null)} onSave={handleSave} />
      <PermDialog
        roleId={permModal} roleName={roles.find((r) => r.id === permModal)?.name || ""}
        permissions={permModal ? perms[permModal] ?? new Set() : new Set()}
        onClose={() => setPermModal(null)}
        onSave={(rid, next) => { setPerms((p) => ({ ...p, [rid]: next })); setPermModal(null); toast.success("权限已更新"); }}
      />
      <MemberDialog
        roleId={memberModal} roleName={roles.find((r) => r.id === memberModal)?.name || ""}
        members={accounts.filter((a) => a.roleId === memberModal)} roles={roles}
        onClose={() => setMemberModal(null)}
        onMove={(aid, fallbackRid) => { setAccounts((p) => p.map((a) => (a.id === aid ? { ...a, roleId: fallbackRid } : a))); toast.success("成员角色已调整"); }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={deleteTarget ? `删除角色「${deleteTarget.name}」后，关联账号将自动转入其他角色。` : ""}
        onConfirm={handleDelete}
        confirmText="删除"
      />
    </div>
  );
}

function RoleDialog({ open, mode, role, onClose, onSave }: {
  open: boolean; mode: "create" | "edit"; role?: AdminRole; onClose: () => void; onSave: (r: AdminRole) => void;
}) {
  const [form, setForm] = useState<AdminRole>(role ?? { id: "", name: "", description: "" });
  useEffect(() => { setForm(role ?? { id: "", name: "", description: "" }); }, [role, open]);
  const submit = () => {
    if (!form.name.trim()) { toast.error("请填写角色名称"); return; }
    onSave(form);
  };
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建角色" : "编辑角色"}</DialogTitle>
          <DialogDescription>字段对齐旧版后台角色管理：角色名称、角色描述，并支持菜单级权限配置。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FL label="角色名称" req><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="请输入角色名称" /></FL>
          <FL label="角色描述"><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="请输入角色描述" /></FL>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}><Save className="size-4 mr-1" />保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermDialog({ roleId, roleName, permissions, onClose, onSave }: {
  roleId: string | null; roleName: string; permissions: Set<string>; onClose: () => void; onSave: (rid: string, p: Set<string>) => void;
}) {
  const [local, setLocal] = useState<Set<string>>(permissions);
  useEffect(() => { setLocal(new Set(permissions)); }, [permissions, roleId]);
  if (!roleId) return null;
  const toggleItem = (pid: string) => { const n = new Set(local); n.has(pid) ? n.delete(pid) : n.add(pid); setLocal(n); };
  const toggleMod = (mod: PermModule) => {
    const mids = mod.items.map((i) => `${mod.id}:${i.id}`);
    const allOn = mids.every((id) => local.has(id));
    const n = new Set(local); mids.forEach((id) => { allOn ? n.delete(id) : n.add(id); }); setLocal(n);
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[82vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldCheck className="size-5 text-amber-600" />权限配置 - {roleName}</DialogTitle>
          <DialogDescription>权限选择到菜单级，保存后立即反映到角色列表权限数。</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {permModules.map((mod) => {
            const mids = mod.items.map((i) => `${mod.id}:${i.id}`);
            const allOn = mids.every((id) => local.has(id));
            const someOn = mids.some((id) => local.has(id));
            return (
              <div key={mod.id} className="rounded-lg border border-slate-200 p-3 space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Checkbox checked={allOn} data-state={allOn ? "checked" : someOn ? "indeterminate" : "unchecked"} onCheckedChange={() => toggleMod(mod)} id={`mod-${mod.id}`} />
                  <Label htmlFor={`mod-${mod.id}`} className="text-sm font-medium cursor-pointer">{mod.name}</Label>
                </div>
                <div className="grid grid-cols-2 gap-2 ml-6">
                  {mod.items.map((item) => {
                    const pid = `${mod.id}:${item.id}`;
                    return (
                      <div key={pid} className="flex items-center gap-1.5">
                        <Checkbox checked={local.has(pid)} onCheckedChange={() => toggleItem(pid)} id={pid} className="size-3.5" />
                        <Label htmlFor={pid} className="text-xs text-muted-foreground cursor-pointer">{item.label}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter className="pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave(roleId, local)}><Save className="size-4 mr-1" />保存权限</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberDialog({ roleId, roleName, members, roles, onClose, onMove }: {
  roleId: string | null; roleName: string; members: AdminAccount[]; roles: AdminRole[];
  onClose: () => void; onMove: (aid: string, rid: string) => void;
}) {
  if (!roleId) return null;
  const fallback = roles.find((r) => r.id !== roleId)?.id;
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Users className="size-5 text-amber-600" />成员管理 - {roleName}</DialogTitle>
          <DialogDescription>用于查看当前角色下的后台账号，可将成员移出当前角色。</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无成员</p>
          ) : members.map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 shadow-sm">
              <div><div className="text-sm font-medium">{m.accountName}</div><div className="text-xs text-muted-foreground">{m.position} · {m.phone}</div></div>
              <Button variant="ghost" size="sm" className="text-rose-500 h-8" disabled={!fallback} onClick={() => fallback && onMove(m.id, fallback)}>移出</Button>
            </div>
          ))}
        </div>
        <DialogFooter className="pt-2 border-t border-slate-100"><Button variant="outline" onClick={onClose}>关闭</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FL({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{req && <span className="text-rose-500 mr-0.5">*</span>}{label}</Label>
      {children}
    </div>
  );
}
