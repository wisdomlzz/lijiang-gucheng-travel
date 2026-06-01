import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../shared/components/ui/tabs";
import { PageHeader } from "../../components/common/PageHeader";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import {
  KeyRound,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface PermissionModule {
  id: string;
  name: string;
  items: { id: string; label: string }[];
}

type AccountStatus = "正常" | "禁用";
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

const permissionModules: PermissionModule[] = [
  { id: "dashboard", name: "工作台", items: [{ id: "view", label: "查看" }] },
  { id: "convenience", name: "便民服务管理", items: [
    { id: "overview", label: "服务概览" },
    { id: "dispatch", label: "派单列表" },
    { id: "zones", label: "片区管理" },
    { id: "config", label: "派单配置" },
    { id: "staff", label: "服务人员" },
    { id: "arbitration", label: "价格仲裁" },
  ] },
  { id: "supplier", name: "商家与供应商", items: [
    { id: "entry", label: "供应商入驻审核" },
    { id: "mall", label: "商城管理后台入口" },
  ] },
  { id: "tourist", name: "游客服务", items: [
    { id: "party", label: "党员服务" },
    { id: "handwash", label: "洗手台" },
    { id: "service", label: "服务" },
    { id: "attractions", label: "景点" },
    { id: "courtyard", label: "文化院落" },
    { id: "parking", label: "停车场" },
    { id: "merchant", label: "购物/餐饮/住宿/酒吧" },
    { id: "facility", label: "厕所/吸烟区/出入口/应急避难" },
  ] },
  { id: "content", name: "内容管理", items: [
    { id: "news", label: "景区资讯" },
    { id: "guides", label: "古城攻略" },
    { id: "serviceCenter", label: "服务中心" },
    { id: "policies", label: "政策法规" },
    { id: "protection", label: "保护指南" },
    { id: "procedures", label: "办事流程" },
    { id: "culture", label: "文化古城/期刊/视频" },
    { id: "routes", label: "精选线路/推荐线路" },
  ] },
  { id: "system", name: "系统管理", items: [
    { id: "accounts", label: "账号管理" },
    { id: "roles", label: "角色管理" },
    { id: "company", label: "公司概况" },
    { id: "complaintPhone", label: "投诉反馈电话" },
    { id: "website", label: "网站管理" },
    { id: "merchantAudit", label: "商家审核" },
    { id: "convenienceAudit", label: "便民服务审核" },
    { id: "analytics", label: "访问统计" },
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

function getAllPermissionIds() {
  return permissionModules.flatMap((m) => m.items.map((i) => `${m.id}:${i.id}`));
}

function getDefaultPermissions(roleId: string): Set<string> {
  const allIds = getAllPermissionIds();
  if (roleId === "R01") return new Set(allIds);
  if (roleId === "R02") {
    return new Set(allIds.filter((p) => p.startsWith("tourist:") || p.startsWith("content:") || p.startsWith("supplier:") || p === "dashboard:view"));
  }
  if (roleId === "R03") {
    return new Set(allIds.filter((p) => p === "system:complaintPhone" || p === "system:convenienceAudit" || p === "dashboard:view"));
  }
  if (roleId === "R04") {
    return new Set(allIds.filter((p) => p.startsWith("convenience:") || p === "dashboard:view"));
  }
  return new Set(["dashboard:view"]);
}

export default function SettingsPage() {
  const location = useLocation();
  const preferredTab = location.pathname.includes("role-management") ? "role" : "account";
  const [activeTab, setActiveTab] = useState(preferredTab);
  const [accounts, setAccounts] = useState<AdminAccount[]>(seedAccounts);
  const [roles, setRoles] = useState<AdminRole[]>(seedRoles);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Set<string>>>(
    Object.fromEntries(seedRoles.map((r) => [r.id, getDefaultPermissions(r.id)])),
  );

  const [accountSearch, setAccountSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState<"全部" | AccountStatus>("全部");
  const [accountRole, setAccountRole] = useState("全部");
  const [roleSearch, setRoleSearch] = useState("");
  const [accountDialog, setAccountDialog] = useState<{ mode: "create" | "edit"; account?: AdminAccount } | null>(null);
  const [roleDialog, setRoleDialog] = useState<{ mode: "create" | "edit"; role?: AdminRole } | null>(null);
  const [permModalRole, setPermModalRole] = useState<string | null>(null);
  const [memberModalRole, setMemberModalRole] = useState<string | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<AdminAccount | null>(null);
  const [deleteRole, setDeleteRole] = useState<AdminRole | null>(null);

  useEffect(() => {
    setActiveTab(preferredTab);
  }, [preferredTab]);

  const roleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? "未分配";

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const keywordHit =
          !accountSearch ||
          account.accountName.includes(accountSearch) ||
          account.phone.includes(accountSearch) ||
          account.position.includes(accountSearch);
        const statusHit = accountStatus === "全部" || account.status === accountStatus;
        const roleHit = accountRole === "全部" || account.roleId === accountRole;
        return keywordHit && statusHit && roleHit;
      }),
    [accounts, accountRole, accountSearch, accountStatus],
  );

  const filteredRoles = useMemo(
    () =>
      roles.filter((role) => !roleSearch || role.name.includes(roleSearch) || role.description.includes(roleSearch)),
    [roleSearch, roles],
  );

  const roleMemberCount = (roleId: string) => accounts.filter((a) => a.roleId === roleId).length;
  const permissionCount = (roleId: string) => rolePermissions[roleId]?.size ?? 0;

  const handleSaveAccount = (account: AdminAccount) => {
    if (accountDialog?.mode === "create") {
      setAccounts((prev) => [{ ...account, id: `A${String(Date.now()).slice(-4)}` }, ...prev]);
      toast.success("账号已新建");
    } else {
      setAccounts((prev) => prev.map((item) => (item.id === account.id ? account : item)));
      toast.success("账号已更新");
    }
    setAccountDialog(null);
  };

  const handleDeleteAccount = () => {
    if (!deleteAccount) return;
    setAccounts((prev) => prev.filter((item) => item.id !== deleteAccount.id));
    toast.success("账号已删除");
    setDeleteAccount(null);
  };

  const handleSaveRole = (role: AdminRole) => {
    if (roleDialog?.mode === "create") {
      const id = `R${String(Date.now()).slice(-3)}`;
      setRoles((prev) => [{ ...role, id }, ...prev]);
      setRolePermissions((prev) => ({ ...prev, [id]: getDefaultPermissions(id) }));
      toast.success("角色已新建");
    } else {
      setRoles((prev) => prev.map((item) => (item.id === role.id ? role : item)));
      toast.success("角色已更新");
    }
    setRoleDialog(null);
  };

  const handleDeleteRole = () => {
    if (!deleteRole) return;
    const fallback = roles.find((role) => role.id !== deleteRole.id)?.id;
    setRoles((prev) => prev.filter((role) => role.id !== deleteRole.id));
    setAccounts((prev) => prev.map((account) => (account.roleId === deleteRole.id && fallback ? { ...account, roleId: fallback } : account)));
    setRolePermissions((prev) => {
      const next = { ...prev };
      delete next[deleteRole.id];
      return next;
    });
    toast.success("角色已删除，相关账号已转入其他角色");
    setDeleteRole(null);
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title={activeTab === "role" ? "角色管理" : "账号管理"}
        desc="复用旧版后台系统管理：账号增删改查、启禁用、角色权限配置和菜单级授权"
        actions={
          activeTab === "role" ? (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setRoleDialog({ mode: "create" })}>
              <Plus className="size-3.5 mr-1" />
              新建角色
            </Button>
          ) : (
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700" onClick={() => setAccountDialog({ mode: "create" })}>
              <UserPlus className="size-3.5 mr-1" />
              新建账号
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="account">账号管理</TabsTrigger>
          <TabsTrigger value="role">角色管理</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative w-72">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 h-9" placeholder="账户名 / 联系电话 / 职位" value={accountSearch} onChange={(e) => setAccountSearch(e.target.value)} />
              </div>
              <select className="h-9 rounded-md border bg-input-background px-3 text-sm" value={accountStatus} onChange={(e) => setAccountStatus(e.target.value as "全部" | AccountStatus)}>
                <option value="全部">全部状态</option>
                <option value="正常">正常</option>
                <option value="禁用">禁用</option>
              </select>
              <select className="h-9 rounded-md border bg-input-background px-3 text-sm" value={accountRole} onChange={(e) => setAccountRole(e.target.value)}>
                <option value="全部">全部角色</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
              <div className="flex-1" />
              <Badge variant="secondary">共 {filteredAccounts.length} 个账号</Badge>
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
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono text-xs">{account.accountName}</TableCell>
                    <TableCell>{account.phone}</TableCell>
                    <TableCell>{account.position}</TableCell>
                    <TableCell>{account.gender}</TableCell>
                    <TableCell>{account.age}</TableCell>
                    <TableCell><Badge className="bg-sky-100 text-sky-700">{roleName(account.roleId)}</Badge></TableCell>
                    <TableCell>
                      <Badge className={account.status === "正常" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setAccountDialog({ mode: "edit", account })}>
                        <Pencil className="size-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setAccounts((prev) =>
                            prev.map((item) =>
                              item.id === account.id ? { ...item, status: item.status === "正常" ? "禁用" : "正常" } : item,
                            ),
                          );
                          toast.success(account.status === "正常" ? "账号已禁用" : "账号已启用");
                        }}
                      >
                        <KeyRound className="size-3.5 mr-1" />
                        {account.status === "正常" ? "禁用" : "启用"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteAccount(account)}>
                        <Trash2 className="size-3.5 mr-1" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">暂无账号</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="role">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative w-72">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9 h-9" placeholder="角色名称 / 角色描述" value={roleSearch} onChange={(e) => setRoleSearch(e.target.value)} />
              </div>
              <div className="flex-1" />
              <Badge variant="secondary">共 {filteredRoles.length} 个角色</Badge>
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
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-xs">{role.id}</TableCell>
                    <TableCell className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-600" />{role.name}</TableCell>
                    <TableCell className="text-muted-foreground">{role.description}</TableCell>
                    <TableCell className="text-right">{roleMemberCount(role.id)}</TableCell>
                    <TableCell className="text-right">{permissionCount(role.id)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setPermModalRole(role.id)}>权限配置</Button>
                      <Button size="sm" variant="ghost" onClick={() => setMemberModalRole(role.id)}>成员管理</Button>
                      <Button size="sm" variant="ghost" onClick={() => setRoleDialog({ mode: "edit", role })}>
                        <Pencil className="size-3.5 mr-1" />
                        编辑
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-600" onClick={() => setDeleteRole(role)}>
                        <Trash2 className="size-3.5 mr-1" />
                        删除
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRoles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">暂无角色</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountDialog
        open={!!accountDialog}
        mode={accountDialog?.mode ?? "create"}
        account={accountDialog?.account}
        roles={roles}
        onClose={() => setAccountDialog(null)}
        onSave={handleSaveAccount}
      />

      <RoleDialog
        open={!!roleDialog}
        mode={roleDialog?.mode ?? "create"}
        role={roleDialog?.role}
        onClose={() => setRoleDialog(null)}
        onSave={handleSaveRole}
      />

      <PermissionDialog
        roleId={permModalRole}
        roleName={roles.find((r) => r.id === permModalRole)?.name || ""}
        permissions={permModalRole ? rolePermissions[permModalRole] ?? new Set() : new Set()}
        onClose={() => setPermModalRole(null)}
        onSave={(roleId, nextPermissions) => {
          setRolePermissions((prev) => ({ ...prev, [roleId]: nextPermissions }));
          setPermModalRole(null);
          toast.success("权限已更新");
        }}
      />

      <MemberDialog
        roleId={memberModalRole}
        roleName={roles.find((r) => r.id === memberModalRole)?.name || ""}
        members={accounts.filter((account) => account.roleId === memberModalRole)}
        roles={roles}
        onClose={() => setMemberModalRole(null)}
        onMoveMember={(accountId, fallbackRoleId) => {
          setAccounts((prev) => prev.map((account) => (account.id === accountId ? { ...account, roleId: fallbackRoleId } : account)));
          toast.success("成员角色已调整");
        }}
      />

      <ConfirmDialog
        open={!!deleteAccount}
        onOpenChange={(open) => !open && setDeleteAccount(null)}
        title="确认删除"
        description={deleteAccount ? `删除账号「${deleteAccount.accountName}」后不可恢复。` : ""}
        onConfirm={handleDeleteAccount}
        confirmText="删除"
      />

      <ConfirmDialog
        open={!!deleteRole}
        onOpenChange={(open) => !open && setDeleteRole(null)}
        title="确认删除"
        description={deleteRole ? `删除角色「${deleteRole.name}」后，关联账号将自动转入其他角色。` : ""}
        onConfirm={handleDeleteRole}
        confirmText="删除"
      />
    </div>
  );
}

function AccountDialog({
  open,
  mode,
  account,
  roles,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  account?: AdminAccount;
  roles: AdminRole[];
  onClose: () => void;
  onSave: (account: AdminAccount) => void;
}) {
  const [form, setForm] = useState<AdminAccount>(
    account ?? {
      id: "",
      accountName: "",
      password: "",
      phone: "",
      position: "",
      gender: "男",
      age: 30,
      status: "正常",
      roleId: roles[0]?.id ?? "",
    },
  );

  useEffect(() => {
    setForm(account ?? {
      id: "",
      accountName: "",
      password: "",
      phone: "",
      position: "",
      gender: "男",
      age: 30,
      status: "正常",
      roleId: roles[0]?.id ?? "",
    });
  }, [account, open, roles]);

  const update = <K extends keyof AdminAccount>(key: K, value: AdminAccount[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    if (!form.accountName.trim()) {
      toast.error("请填写账户名");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("请填写联系电话");
      return;
    }
    if (!form.position.trim()) {
      toast.error("请填写职位");
      return;
    }
    if (mode === "create" && !form.password.trim()) {
      toast.error("请填写密码");
      return;
    }
    onSave({ ...form, password: form.password || "******" });
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建账号" : "编辑账号"}</DialogTitle>
          <DialogDescription>字段对齐旧版后台用户管理：账户名、密码、联系电话、职位、性别、年龄、是否启用、用户角色。</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <Field label="账户名" required>
            <Input maxLength={50} value={form.accountName} onChange={(e) => update("accountName", e.target.value)} placeholder="请输入账户名" />
          </Field>
          <Field label="密码" required={mode === "create"}>
            <Input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder={mode === "edit" ? "留空则不修改" : "请输入密码"} />
          </Field>
          <Field label="联系电话" required>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="请输入联系电话" />
          </Field>
          <Field label="职位" required>
            <Input maxLength={50} value={form.position} onChange={(e) => update("position", e.target.value)} placeholder="请输入职位" />
          </Field>
          <Field label="性别">
            <select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.gender} onChange={(e) => update("gender", e.target.value as Gender)}>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </Field>
          <Field label="年龄">
            <Input type="number" min={18} max={70} value={form.age} onChange={(e) => update("age", Number(e.target.value) || 18)} />
          </Field>
          <Field label="是否启用">
            <select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.status} onChange={(e) => update("status", e.target.value as AccountStatus)}>
              <option value="正常">正常</option>
              <option value="禁用">禁用</option>
            </select>
          </Field>
          <Field label="用户角色">
            <select className="h-9 w-full rounded-md border bg-input-background px-3 text-sm" value={form.roleId} onChange={(e) => update("roleId", e.target.value)}>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
            </select>
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}>
            <Save className="size-4 mr-1" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleDialog({
  open,
  mode,
  role,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: "create" | "edit";
  role?: AdminRole;
  onClose: () => void;
  onSave: (role: AdminRole) => void;
}) {
  const [form, setForm] = useState<AdminRole>(role ?? { id: "", name: "", description: "" });

  useEffect(() => {
    setForm(role ?? { id: "", name: "", description: "" });
  }, [role, open]);

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("请填写角色名称");
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建角色" : "编辑角色"}</DialogTitle>
          <DialogDescription>字段对齐旧版后台角色管理：角色名称、角色描述，并支持菜单级权限配置。</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="角色名称" required>
            <Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="请输入角色名称" />
          </Field>
          <Field label="角色描述">
            <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="请输入角色描述" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={submit}>
            <Save className="size-4 mr-1" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionDialog({
  roleId,
  roleName,
  permissions,
  onClose,
  onSave,
}: {
  roleId: string | null;
  roleName: string;
  permissions: Set<string>;
  onClose: () => void;
  onSave: (roleId: string, permissions: Set<string>) => void;
}) {
  const [localPermissions, setLocalPermissions] = useState<Set<string>>(permissions);

  useEffect(() => {
    setLocalPermissions(new Set(permissions));
  }, [permissions, roleId]);

  if (!roleId) return null;

  const toggleItem = (permId: string) => {
    const next = new Set(localPermissions);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    setLocalPermissions(next);
  };

  const toggleModule = (module: PermissionModule) => {
    const moduleIds = module.items.map((i) => `${module.id}:${i.id}`);
    const allChecked = moduleIds.every((id) => localPermissions.has(id));
    const next = new Set(localPermissions);
    moduleIds.forEach((id) => {
      if (allChecked) next.delete(id);
      else next.add(id);
    });
    setLocalPermissions(next);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[82vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-amber-600" />
            权限配置 - {roleName}
          </DialogTitle>
          <DialogDescription>权限选择到菜单级，保存后立即反映到角色列表权限数。</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {permissionModules.map((mod) => {
            const moduleIds = mod.items.map((i) => `${mod.id}:${i.id}`);
            const allChecked = moduleIds.every((id) => localPermissions.has(id));
            const someChecked = moduleIds.some((id) => localPermissions.has(id));

            return (
              <div key={mod.id} className="rounded-lg border border-slate-200 p-3 space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allChecked}
                    data-state={allChecked ? "checked" : someChecked ? "indeterminate" : "unchecked"}
                    onCheckedChange={() => toggleModule(mod)}
                    id={`mod-${mod.id}`}
                  />
                  <Label htmlFor={`mod-${mod.id}`} className="text-sm font-medium cursor-pointer">
                    {mod.name}
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-2 ml-6">
                  {mod.items.map((item) => {
                    const permId = `${mod.id}:${item.id}`;
                    return (
                      <div key={permId} className="flex items-center gap-1.5">
                        <Checkbox
                          checked={localPermissions.has(permId)}
                          onCheckedChange={() => toggleItem(permId)}
                          id={permId}
                          className="size-3.5"
                        />
                        <Label htmlFor={permId} className="text-xs text-muted-foreground cursor-pointer">
                          {item.label}
                        </Label>
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
          <Button onClick={() => onSave(roleId, localPermissions)}>
            <Save className="size-4 mr-1" />
            保存权限
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberDialog({
  roleId,
  roleName,
  members,
  roles,
  onClose,
  onMoveMember,
}: {
  roleId: string | null;
  roleName: string;
  members: AdminAccount[];
  roles: AdminRole[];
  onClose: () => void;
  onMoveMember: (accountId: string, fallbackRoleId: string) => void;
}) {
  if (!roleId) return null;
  const fallbackRole = roles.find((role) => role.id !== roleId)?.id;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-amber-600" />
            成员管理 - {roleName}
          </DialogTitle>
          <DialogDescription>用于查看当前角色下的后台账号，可将成员移出当前角色。</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无成员</p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 shadow-sm">
                <div>
                  <div className="text-sm font-medium">{member.accountName}</div>
                  <div className="text-xs text-muted-foreground">{member.position} · {member.phone}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-rose-500 h-8"
                  disabled={!fallbackRole}
                  onClick={() => fallbackRole && onMoveMember(member.id, fallbackRole)}
                >
                  移出
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">
        {required && <span className="text-rose-500 mr-0.5">*</span>}
        {label}
      </Label>
      {children}
    </div>
  );
}
