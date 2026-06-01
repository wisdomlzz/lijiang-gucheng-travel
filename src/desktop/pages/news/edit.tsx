import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import type { NewsItem } from "../../../shared/types/content-types";
import { z } from "zod";
import { Input } from "../../../shared/components/ui/input";
import { Textarea } from "../../../shared/components/ui/textarea";
import { FormPage } from "../../components/common/FormPage";
import { toast } from "sonner";

const newsSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().optional(),
  body: z.string().optional(),
});

export default function NewsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const item = useContentManageStore((s) => s.news.find((n) => n.id === id));
  const updateNews = useContentManageStore((s) => s.updateNews);
  const [form, setForm] = useState({ title: "", tag: "", tagColor: "#3B82F6", date: "", summary: "", category: "", imageUrl: "", body: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        tag: item.tag,
        tagColor: item.tagColor,
        date: item.date,
        summary: item.summary,
        category: item.category,
        imageUrl: item.imageUrl,
        body: item.body ? item.body.join("\n") : "",
      });
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    const result = newsSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    updateNews(item.id, {
      title: form.title,
      tag: form.tag || "公告",
      tagColor: form.tagColor || "#3B82F6",
      date: form.date,
      summary: form.summary,
      category: form.category as any,
      imageUrl: form.imageUrl,
      body: form.body ? form.body.split("\n").filter(Boolean) : undefined,
    });
    toast.success("已更新");
    navigate("/desktop/news");
  };

  const set = (field: string, value: any) => setForm({ ...form, [field]: value });

  return (
    <FormPage title="编辑资讯" backPath="/desktop/news" onSave={handleSave} saving={saving}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">标题</label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">标签</label>
          <Input value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="热门活动" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">标签色号</label>
          <div className="flex gap-2 items-center">
            <Input type="color" className="w-10 h-10 p-1" value={form.tagColor} onChange={(e) => set("tagColor", e.target.value)} />
            <Input value={form.tagColor} onChange={(e) => set("tagColor", e.target.value)} placeholder="#3B82F6" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">日期</label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">分类</label>
          <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="其他" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">封面图 URL</label>
          <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">摘要</label>
          <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={2} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">正文</label>
          <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={6} placeholder="支持多行文本" />
        </div>
      </div>
    </FormPage>
  );
}
