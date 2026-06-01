import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronDown, ImagePlus } from "lucide-react";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { toast } from "sonner";
import type { NewsCategory } from "../../shared/types/content-types";

export function InfoCreatePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<NewsCategory | "">("");
  const [showPicker, setShowPicker] = useState(false);
  const infoCategories: NewsCategory[] = ["公房公告", "房屋信息", "举贤纳仕", "其它"];
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [desc, setDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!category) {
      toast.error("请选择发布类型");
      return;
    }
    if (!title.trim()) {
      toast.error("请输入标题");
      return;
    }
    if (!phone.trim()) {
      toast.error("请输入联系电话");
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      toast.error("请输入正确的手机号");
      return;
    }
    if (desc.trim().length < 10) {
      toast.error("描述至少需要10个字符");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("发布成功");
      setSubmitting(false);
      navigate("/c/info");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface-page pb-24">
      {/* Banner header */}
      <div className="relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=70"
          alt="banner"
          className="w-full h-[136px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#7FB6D9]/20 to-surface-page" />
        <div className="absolute top-0 left-0 right-0 flex items-center h-[52px] px-3">
          <button
            onClick={() => navigate("/c/info")}
            className="w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center active:opacity-80 shadow-sm"
          >
            <ChevronLeft size={22} className="text-text-body" />
          </button>
          <h1 className="flex-1 text-center text-[17px] text-text-body pr-9">我的发布</h1>
        </div>
      </div>

      {/* Form card */}
      <div className="px-3 -mt-8 relative">
        <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(60,120,200,0.10)] p-4 space-y-3.5">
          {/* 发布类型 */}
          <Field label="发布类型">
            <button
              onClick={() => setShowPicker(true)}
              className="w-full h-10 px-3 rounded-xl bg-[#FFFBF2] border border-primary-100 flex items-center justify-between"
            >
              <span className={`text-[13px] ${category ? "text-text-body" : "text-text-tertiary"}`}>
                {category || "请选择类型"}
              </span>
              <ChevronDown size={14} className="text-text-tertiary" />
            </button>
          </Field>

          <Field label="标题">
            <TextInput value={title} onChange={setTitle} placeholder="请输入标题" />
          </Field>

          <Field label="电话">
            <TextInput value={phone} onChange={setPhone} placeholder="请输入电话" />
          </Field>

          <Field label="详细地址">
            <TextInput value={address} onChange={setAddress} placeholder="请输入详细地址" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="经度">
              <TextInput value={lng} onChange={setLng} placeholder="经度" />
            </Field>
            <Field label="纬度">
              <TextInput value={lat} onChange={setLat} placeholder="纬度" />
            </Field>
          </div>

          <Field label="图片上传">
            <div className="flex items-start gap-3">
              <button
                onClick={() => toast.info("选择图片")}
                className="w-[72px] h-[72px] rounded-xl border border-dashed border-[#E5D8BC] bg-[#FFFBF2] flex flex-col items-center justify-center text-[#B8884A] active:scale-95 transition-transform"
              >
                <ImagePlus size={20} />
                <span className="text-[10px] mt-1">上传图片</span>
              </button>
              <div className="flex-1 text-[11px] text-text-tertiary leading-relaxed pt-1">
                1. 最多上传 9 张图片，支持 jpg/png 格式
                <br />
                2. 图片大小 &lt; 小于等于 10M
              </div>
            </div>
          </Field>

          <Field label="描述">
            <div className="relative">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value.slice(0, 500))}
                placeholder="请输入描述"
                rows={4}
                className="w-full px-3 py-2 rounded-xl bg-[#FFFBF2] border border-primary-100 text-[13px] text-text-body placeholder:text-text-tertiary outline-none resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] text-text-tertiary">
                已输入 {desc.length}/500
              </span>
            </div>
          </Field>
        </div>
      </div>

      {/* Submit */}
      <div className="px-8 mt-5">
        <button
          onClick={submit}
          disabled={submitting}
          className={`w-full h-11 rounded-full bg-gradient-to-r from-primary to-primary text-white text-[14px] shadow-[0_4px_12px_rgba(60,120,200,0.2)] active:scale-[0.99] transition-transform ${
            submitting ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {submitting ? "发布中..." : "发布"}
        </button>
      </div>

      {/* Category picker */}
      {showPicker && (
        <div
          onClick={() => setShowPicker(false)}
          className="fixed inset-0 bg-black/40 z-30 flex items-end"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex justify-center pt-2">
              <span className="w-10 h-1 rounded-full bg-primary-100" />
            </div>
            <p className="text-center text-[14px] text-text-body py-2">选择发布类型</p>
            <div className="divide-y divide-surface-page">
              {infoCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setCategory(c);
                    setShowPicker(false);
                  }}
                  className={`w-full py-3 text-[14px] ${
                    c === category ? "text-primary" : "text-text-body"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPicker(false)}
              className="w-full py-3 text-[14px] text-text-tertiary border-t-[6px] border-surface-page"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] text-text-body mb-1.5">
        <span className="text-primary mr-0.5">*</span>
        {label}
      </p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 px-3 rounded-xl bg-[#FFFBF2] border border-primary-100 text-[13px] text-text-body placeholder:text-text-tertiary outline-none"
    />
  );
}
