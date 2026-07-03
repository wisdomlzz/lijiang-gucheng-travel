import { useEffect, useState, type InputHTMLAttributes } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PageHeader } from "../components/PageHeader";
import { useAddressStore } from "../../features/address/store"
import type { Address } from "../../features/address/store";
import { useAuthStore } from "../../shared/stores/auth-store";

const DEFAULT_REGION = {
  province: "云南省",
  city: "丽江市",
  district: "古城区",
};

export function AddressEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addresses = useAddressStore((s) => s.addresses);
  const upsert = useAddressStore((s) => s.upsert);
  const editing = id && id !== "new" ? addresses.find((a) => a.id === id) : undefined;
  const userId = user?.id ?? "u_c_001";
  const userAddresses = addresses.filter((a) => a.userId === userId);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    province: DEFAULT_REGION.province,
    city: DEFAULT_REGION.city,
    district: DEFAULT_REGION.district,
    detail: "",
    isDefault: userAddresses.length === 0,
  });

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        phone: editing.phone,
        province: editing.province,
        city: editing.city,
        district: editing.district,
        detail: editing.detail,
        isDefault: editing.isDefault,
      });
    }
  }, [editing]);

  const set = (field: keyof typeof form, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("请填写联系人");
      return;
    }
    if (!/^1\d{10}$/.test(form.phone.trim())) {
      toast.error("请填写正确的手机号");
      return;
    }
    if (!form.detail.trim()) {
      toast.error("请填写详细地址");
      return;
    }

    const next: Address = {
      id: editing?.id ?? `addr_${Date.now()}`,
      userId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      province: form.province.trim() || DEFAULT_REGION.province,
      city: form.city.trim() || DEFAULT_REGION.city,
      district: form.district.trim() || DEFAULT_REGION.district,
      detail: form.detail.trim(),
      isDefault: form.isDefault || userAddresses.length === 0,
    };

    upsert(next);
    toast.success(editing ? "地址已更新" : "地址已新增");
    navigate("/c/addresses");
  };

  return (
    <div className="min-h-full bg-surface-page pb-24">
      <PageHeader title={editing ? "编辑地址" : "新增地址"} back="/c/addresses" />

      <div className="p-3 space-y-3">
        <Field label="联系人" value={form.name} onChange={(v) => set("name", v)} placeholder="请输入联系人姓名" />
        <Field label="手机号" value={form.phone} onChange={(v) => set("phone", v)} placeholder="请输入 11 位手机号" inputMode="tel" />

        <div className="bg-white rounded-2xl p-4 space-y-3">
          <div className="text-[13px] text-text-body font-medium">所在区域</div>
          <div className="grid grid-cols-3 gap-2">
            <input value={form.province} onChange={(e) => set("province", e.target.value)} className="h-10 rounded-xl bg-surface-page px-3 text-[13px] outline-none" />
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className="h-10 rounded-xl bg-surface-page px-3 text-[13px] outline-none" />
            <input value={form.district} onChange={(e) => set("district", e.target.value)} className="h-10 rounded-xl bg-surface-page px-3 text-[13px] outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4">
          <label className="text-[13px] text-text-body font-medium">详细地址</label>
          <textarea
            value={form.detail}
            onChange={(e) => set("detail", e.target.value)}
            rows={4}
            placeholder="街道、门牌号、院落名称等"
            className="mt-3 w-full rounded-xl bg-surface-page px-3 py-3 text-[13px] outline-none resize-none"
          />
        </div>

        <button
          type="button"
          onClick={() => set("isDefault", !form.isDefault)}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-between"
        >
          <span className="text-[14px] text-text-body">设为默认地址</span>
          <span className={`w-11 h-6 rounded-full p-0.5 transition ${form.isDefault ? "bg-primary" : "bg-[#D1D5DB]"}`}>
            <span className={`block w-5 h-5 rounded-full bg-white transition ${form.isDefault ? "translate-x-5" : ""}`} />
          </span>
        </button>
      </div>

      <div className="fixed left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-surface-page to-transparent pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          onClick={handleSave}
          className="w-full h-11 rounded-full bg-primary text-white text-[14px] shadow-lg"
        >
          保存地址
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <label className="text-[13px] text-text-body font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-3 w-full h-10 rounded-xl bg-surface-page px-3 text-[13px] outline-none"
      />
    </div>
  );
}
