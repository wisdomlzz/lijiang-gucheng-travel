import { useState } from "react";
import { useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import type { TravelGuide } from "../../../shared/types/content-types";
import { z } from "zod";
import { Input } from "../../../shared/components/ui/input";
import { Textarea } from "../../../shared/components/ui/textarea";
import { FormPage } from "../../components/common/FormPage";
import { toast } from "sonner";

const guideSchema = z.object({
  name: z.string().min(1, "请输入名称"),
  tags: z.string().optional(),
  duration: z.string().optional(),
  difficulty: z.string().optional(),
  description: z.string().optional(),
  cover: z.string().optional(),
});

export default function TravelGuidesCreate() {
  const navigate = useNavigate();
  const addGuide = useContentManageStore((s) => s.addGuide);
  const [form, setForm] = useState({
    name: "", tags: "", duration: "", difficulty: "", description: "", cover: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const result = guideSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    const tags = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const item: TravelGuide = {
      id: "",
      name: form.name,
      tags,
      duration: form.duration || "1小时",
      difficulty: form.difficulty || "简单",
      stops: 0,
      distance: "",
      spotNames: [],
      description: form.description || "",
      cover: form.cover || "",
      spots: [],
    };
    addGuide(item);
    toast.success("已新增");
    navigate("/desktop/travel-guides");
  };

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <FormPage title="新建攻略" backPath="/desktop/travel-guides" onSave={handleSave} saving={saving}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">名称</label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">标签（逗号分隔）</label>
          <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="热门, 摄影, 美食" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">时长</label>
          <Input value={form.duration} onChange={(e) => set("duration", e.target.value)} placeholder="如 3小时" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">难度</label>
          <Input value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} placeholder="简单/中等/较难" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">封面图 URL</label>
          <Input value={form.cover} onChange={(e) => set("cover", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">描述</label>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} />
        </div>
      </div>
    </FormPage>
  );
}
