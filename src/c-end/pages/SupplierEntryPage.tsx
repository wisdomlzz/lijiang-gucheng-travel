import { useState } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "./shop/PageHeader";
import { Building2, User, Phone, MapPin, FileText, AlignLeft, Check, ChevronRight, Store } from "lucide-react";
import { toast } from "sonner";
import { useSupplierStore } from "../../shared/stores/supplier-store";
import { ImageUpload } from "../../shared/components/ui/image-upload";

const BUSINESS_TYPES = ["餐饮", "住宿", "酒吧", "文创", "手工艺", "服装", "其他"];
const STEPS = ["填写信息", "确认提交", "提交成功"];

export function SupplierEntryPage() {
  const navigate = useNavigate();
  const addApplication = useSupplierStore((s) => s.addApplication);

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    businessType: "",
    address: "",
    licenseNo: "",
    licenseImg: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.companyName.trim()) {
      errs.companyName = "请输入公司/店铺名称";
    } else if (form.companyName.trim().length < 2) {
      errs.companyName = "名称至少2个字符";
    }
    if (!form.contactName.trim()) {
      errs.contactName = "请输入联系人";
    }
    if (!form.phone.trim()) {
      errs.phone = "请输入联系电话";
    } else if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) {
      errs.phone = "请输入正确的手机号";
    }
    if (!form.businessType) {
      errs.businessType = "请选择经营类型";
    }
    if (!form.address.trim()) {
      errs.address = "请输入经营地址";
    }
    if (!form.licenseNo.trim()) {
      errs.licenseNo = "请输入营业执照号";
    }
    return errs;
  };

  const handleNext = () => {
    if (step === 0) {
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        return;
      }
      setErrors({});
      setStep(1);
    } else if (step === 1) {
      setStep(2);
      addApplication(form);
      toast.success("提交成功，等待审核");
    }
  };

  const inputClass = (field: string) =>
    `w-full h-12 px-4 rounded-xl border text-[14px] outline-none transition-all ${
      errors[field]
        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
        : "border-border-light bg-white focus:ring-2 focus:ring-primary/30 focus:border-primary"
    }`;

  return (
    <div className="min-h-full bg-surface-page pb-24">
      <PageHeader title="供应商入驻" back="/c/profile" />

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary to-[#1D4ED8] px-5 py-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/8" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/8" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
            <Store size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-white text-[18px] font-semibold">商家入驻申请</h1>
            <p className="text-white/70 text-[12px] mt-1">入驻丽江古城游，开启线上经营</p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 py-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all ${
                    i <= step
                      ? "bg-primary text-white shadow-[0_4px_12px_rgba(37,99,235,0.3)]"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                <span className={`text-[11px] mt-1.5 ${i <= step ? "text-primary font-medium" : "text-text-tertiary"}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Step 0: Form */}
        {step === 0 && (
          <>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                      <Building2 size={13} className="text-primary" /> 公司/店铺名称
                    </label>
                    <input
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      placeholder="请输入公司或店铺名称"
                      className={inputClass("companyName")}
                    />
                    {errors.companyName && <p className="text-[11px] text-red-500 mt-1.5">{errors.companyName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                        <User size={13} className="text-primary" /> 联系人
                      </label>
                      <input
                        value={form.contactName}
                        onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                        placeholder="姓名"
                        className={inputClass("contactName")}
                      />
                      {errors.contactName && <p className="text-[11px] text-red-500 mt-1.5">{errors.contactName}</p>}
                    </div>
                    <div>
                      <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                        <Phone size={13} className="text-primary" /> 联系电话
                      </label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="手机号"
                        className={inputClass("phone")}
                      />
                      {errors.phone && <p className="text-[11px] text-red-500 mt-1.5">{errors.phone}</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <label className="text-[12px] text-text-secondary mb-3 flex items-center gap-1.5">
                  <span className="text-red-500">*</span> 经营类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, businessType: t })}
                      className={`px-4 py-2 rounded-full text-[13px] transition-all ${
                        form.businessType === t
                          ? "bg-primary text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]"
                          : "bg-surface-page border border-border-light text-text-secondary hover:border-primary/50"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {errors.businessType && <p className="text-[11px] text-red-500 mt-2">{errors.businessType}</p>}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <div>
                  <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-primary" /> 经营地址
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="请输入详细地址"
                    className={inputClass("address")}
                  />
                  {errors.address && <p className="text-[11px] text-red-500 mt-1.5">{errors.address}</p>}
                </div>

                <div>
                  <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-primary" /> 营业执照号
                  </label>
                  <input
                    value={form.licenseNo}
                    onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
                    placeholder="统一社会信用代码"
                    className={inputClass("licenseNo")}
                  />
                  {errors.licenseNo && <p className="text-[11px] text-red-500 mt-1.5">{errors.licenseNo}</p>}
                </div>

                <div>
                  <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                    <FileText size={13} className="text-primary" /> 营业执照照片
                  </label>
                  <ImageUpload
                    value={form.licenseImg}
                    onChange={(v) => setForm({ ...form, licenseImg: v })}
                  />
                </div>

                <div>
                  <label className="text-[12px] text-text-secondary mb-2 flex items-center gap-1.5">
                    <AlignLeft size={13} className="text-primary" /> 经营范围简介
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="请简要描述您的经营范围和特色服务"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-white text-[14px] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                  {errors.description && <p className="text-[11px] text-red-500 mt-1.5">{errors.description}</p>}
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-transform flex items-center justify-center gap-1"
            >
              下一步 <ChevronRight size={18} className="ml-1" />
            </button>
          </>
        )}

        {/* Step 1: Confirm */}
        {step === 1 && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-[15px] font-semibold text-text-heading mb-4 flex items-center gap-2">
                <Check size={18} className="text-primary" /> 确认申请信息
              </h3>
              <div className="space-y-3">
                {[
                  ["公司名称", form.companyName],
                  ["联系人", form.contactName],
                  ["联系电话", form.phone],
                  ["经营类型", form.businessType],
                  ["经营地址", form.address],
                  ["营业执照号", form.licenseNo],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2.5 border-b border-border-light last:border-0">
                    <span className="text-[12px] text-text-tertiary">{label}</span>
                    <span className="text-[13px] text-text-body font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border-light">
                <span className="text-[12px] text-text-tertiary">经营范围简介</span>
                <p className="text-[13px] text-text-body mt-1.5 leading-relaxed">{form.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleNext}
                className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Check size={18} /> 确认提交申请
              </button>
              <button
                onClick={() => setStep(0)}
                className="w-full h-11 rounded-full border border-border-light text-text-secondary text-[14px] hover:bg-surface-page transition-colors"
              >
                返回修改
              </button>
            </div>
          </>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center mb-5 shadow-lg">
                <Check size={48} className="text-green-500" />
              </div>
              <h2 className="text-[20px] font-bold text-text-heading">提交成功！</h2>
              <p className="text-[13px] text-text-secondary mt-3 leading-relaxed px-4">
                您的入驻申请已提交<br />
                预计 <span className="text-primary font-medium">1-3 个工作日</span> 内完成审核
              </p>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border border-primary/10">
              <h3 className="text-[14px] font-semibold text-text-heading mb-4">审核通过后，您将获得</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-[13px] font-semibold">1</span>
                  </div>
                  <span className="text-[13px] text-text-body">丽江古城游桌面端登录权限</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-[13px] font-semibold">2</span>
                  </div>
                  <span className="text-[13px] text-text-body">通过单点登录进入商城后台管理</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary text-[13px] font-semibold">3</span>
                  </div>
                  <span className="text-[13px] text-text-body">商家信息展示在"购在古城"</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate("/c/supplier-status")}
                className="w-full h-12 rounded-full bg-primary text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                <Check size={18} /> 查询审核进度
              </button>
              <button
                onClick={() => navigate("/c/profile")}
                className="w-full h-11 rounded-full border border-border-light text-text-secondary text-[14px] hover:bg-surface-page transition-colors"
              >
                返回个人中心
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}