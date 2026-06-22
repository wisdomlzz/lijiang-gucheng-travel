import { useEffect, useMemo, useState } from "react";
import { Card } from "../../../shared/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/table";
import { Button } from "../../../shared/components/ui/button";
import { Badge } from "../../../shared/components/ui/badge";
import { Label } from "../../../shared/components/ui/label";
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
  KeyRound,
  Pencil,
  Save,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { usePagination } from "../../../shared/hooks/usePagination";

const PAGE_SIZE = 10;
type Gender = "男" | "女";

type AdminRole = {
  id: string;
  name: string;
  description: string;
};

type AdminAccount = {
  id: string;
  accountName: string;
  password: string;
  phone: string;
  position: string;
  gender: Gender;
  age: number;
  status: AccountStatus;
  roleId: string;
};

const seedRoles: AdminRole[] = [
  { id: "R01", name: "平台管理员", description: "全部后台菜单权限" },
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

export default function AccountPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(seedAccounts);
  const [roles] = useState<AdminRole[]>(seedRoles);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"全部" | AccountStatus>("全部");
  const [roleFilter, setRoleFilter] = useState("全部");
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; account?: AdminAccount } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? "未分配";

  const filtered = useMemo(
    () => accounts.filter((a) => {
      const kw = !search || a.accountName.includes(search) || a.phone.includes(search) || a.position.includes(search);
      const st = statusFilter === "全部" || a.status === statusFilter;
      const rl = roleFilter === "全部" || a.roleId === roleFilter;
      return kw && st && rl;
    }),
    [accounts, search, statusFilter, roleFilter],
  );

  const { currentPage, setCurrentPage, totalPages, paginatedItems, total: _total } = usePagination(filtered, PAGE_SIZE);

  const handleSave = (account: AdminAccount) => {
    if (dialog?.mode === "create") {
      setAccounts((p) => [{ ...account, id: `A${String(Date.now()).slice(-4)}` }, ...p]);
      toast.success("账号已新建");
    } else {
      setAccounts((p) => p.map((i) => (i.id === account.id ? account : i)));
      toast.success("账号已更新");
    }
    setDialog(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setAccounts((p) => p.filter((i) => i.id !== deleteTarget.id));
    toast.success("账号已删除");
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="账号管理"
        desc="复用旧版后台系统管理：账号增删改查、启禁用"
        actions={
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setDialog({ mode: "create" })}>
            <UserPlus className="size-3.5 mr-1" />新建账号
          </Button>
        }
      />
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9 h-9" placeholder="账户名 / 联系电话 / 职位" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="h-9 rounded-md border bg-input-background px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "全部" | AccountStatus)}>
            <option value="全部">全部状态</option>
            <option value="正常">正常</option>
            <option value="禁用">禁用</option>
          </select>
          <select className="h-9 rounded-md border bg-input-background px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="全部">全部角色</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <div className="flex-1" />
          <Badge variant="secondary">共 {filtered.length} 个账号</Badge>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>账户名</TableHead>
              <TableHead>联系电话</TableHead>
              <TableHead>职位</TableHead>
              <TableHead>性别</TableHead>
              <TableHead>年龄</TableHead>
              <TableHead>用户角色</TableHead>
              <TableHead>是否启用</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.accountName}</TableCell>
                <TableCell>{a.phone}</TableCell>
                <TableCell>{a.position}</TableCell>
                <TableCell>{a.gender}</TableCell>
                <TableCell>{a.age}</TableCell>
                <TableCell><Badge className="bg-sky-100 text-sky-700">{roleName(a.roleId)}</Badge></TableCell>
                <TableCell>
                  <Badge className={a.status === "正常" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>{a.status}</Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => setDialog({ mode: "edit", account: a })}>
                    <Pencil className="size-3.5 mr-1" />编辑
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    setAccounts((p) => p.map((i) => i.id === a.id ? { ...i, status: i.status === "正常" ? "禁用" : "正常" } : i));
                    toast.success(a.status === "正常" ? "账号已禁用" : "账号已启用");
                  }}>
                    <KeyRound className="size-3.5 mr-1" />{a.status === "正常" ? "禁用" : "启用"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteTarget(a)}>
                    <Trash2 className="size-3.5 mr-1" />删除
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无账号</TableCell></TableRow>
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

      <AccountDialog
        open={!!dialog}
        mode={dialog?.mode ?? "create"}
        account={dialog?.account}
        roles={roles}
        onClose={() => setDialog(null)}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="确认删除"
        description={deleteTarget ? `删除账号「${deleteTarget.accountName}」后不可恢复。` : ""}
        onConfirm={handleDelete}
        confirmText="删除"
      />
    </div>
  );
}

function AccountDialog({ open, mode, account, roles, onClose, onSave }: {
  open: boolean; mode: "create" | "edit"; account?: AdminAccount; roles: AdminRole[];
  onClose: () => void; onSave: (a: AdminAccount) => void;
}) {
  const [form, setForm] = useState<AdminAccount>(
    account ?? { id: "", accountName: "", password: "", phone: "", position: "", gender: "男", age: 30, status: "正常", roleId: roles[0]?.id ?? "" },
  );
  useEffect(() => { setForm(account ?? { id: "", accountName: "", password: "", phone: "", position: "", gender: "男", age: 30, status: "正常", roleId: roles[0]?.id ?? "" }); }, [account, open, roles]);
  const upd = <K extends keyof AdminAccount>(k: K, v: AdminAccount[K]) => setForm((p) => ({ ...p, [k]: v }));
  const submit = () => {
    if (!form.accountName.trim()) { toast.error("请填写账户名"); return; }
    if (!form.phone.trim()) { toast.error("请填写联系电话"); return; }
    if (!form.position.trim()) { toast.error("请填写职位"); return; }
    if (mode === "create" && !form.password.trim()) { toast.error("请填写密码"); return; }
    onSave({ ...form, password: form.password || "******" });
  };
  return (
    <Dialog open={open} onOpenChange={(n) => !n && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建账号" : "编辑账号"}</DialogTitle>
          <DialogDescription>字段对齐旧版后台用户管理：账户名、密码、联系电话、职位、性别、年龄、是否启用、用户角色。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <FL label="账户名" req><Input maxLength={50} value={form.accountName} onChange={(e) => upd("accountName", e.target.value)} placeholder="请输入账户名" /></FL>
          <FL label="密码" req={mode === "create"}><Input type="password" value={form.password} onChange={(e) => upd("password", e.target.value)} placeholder={mode === "edit" ? "留空则不修改" : "请输入密码"} /></FL>
          <FL label="联系电话" req><Input value={form.phone} onChange={(e) => upd("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="请输入联系电话" /></FL>
          <FL label="职位" req><Input maxLength={50} value={form.position} onChange={(e) => upd("position", e.target.value)} placeholder="请输入职位" /></FL>
          <FL label="性别"><select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.gender} onChange={(e) => upd("gender", e.target.value as Gender)}><option value="男">男</option><option value="女">女</option></select></FL>
          <FL label="年龄"><Input type="number" min={18} max={70} value={form.age} onChange={(e) => upd("age", Number(e.target.value) || 18)} /></FL>
          <FL label="是否启用"><select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.status} onChange={(e) => upd("status", e.target.value as AccountStatus)}><option value="正常">正常</option><option value="禁用">禁用</option></select></FL>
          <FL label="用户角色"><select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.roleId} onChange={(e) => upd("roleId", e.target.value)}>{roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></FL>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}><Save className="size-4 mr-1" />保存</Button>
        </DialogFooter>
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
