import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useContentManageStore } from "../../../shared/stores/content-manage-store";
import type { NewsItem, NewsCategory } from "../../../shared/types/content-types";
import { z } from "zod";
import { Input } from "../../../shared/components/ui/input";
import { Textarea } from "../../../shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../shared/components/ui/select";
import { FormPage } from "../../components/common/FormPage";
import { toast } from "sonner";

const CATEGORIES: NewsCategory[] = ["公房公告", "房屋信息", "举贤纳仕", "其它"];

const newsSchema = z.object({
  title: z.string().min(1, "请输入标题"),
  imageUrl: z.string().optional(),
  tag: z.string().optional(),
  tagColor: z.string().optional(),
  date: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  heroTitle: z.string().optional(),
  body: z.string().optional(),
});

export default function ScenicNewsEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const newsItem = useContentManageStore((s) => s.news.find((n) => n.id === id));
  const updateNews = useContentManageStore((s) => s.updateNews);
  const [form, setForm] = useState({
    title: "", imageUrl: "", tag: "", tagColor: "#3B82F6", date: "", summary: "", category: "其它" as string, heroTitle: "", body: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (newsItem) {
      setForm({
        title: newsItem.title,
        imageUrl: newsItem.imageUrl,
        tag: newsItem.tag,
        tagColor: newsItem.tagColor,
        date: newsItem.date,
        summary: newsItem.summary,
        category: newsItem.category,
        heroTitle: newsItem.heroTitle || "",
        body: newsItem.body ? newsItem.body.join("\n") : "",
      });
    }
  }, [newsItem]);

  if (!newsItem) return null;

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
    const bodyLines = form.body ? form.body.split("\n").filter((l) => l.trim()) : [];
    updateNews(newsItem.id, {
      title: form.title,
      imageUrl: form.imageUrl || "",
      tag: form.tag || "公告",
      tagColor: form.tagColor || "#3B82F6",
      date: form.date || newsItem.date,
      summary: form.summary || "",
      category: form.category as NewsCategory,
      heroTitle: form.heroTitle || undefined,
      body: bodyLines.length > 0 ? bodyLines : undefined,
    });
    toast.success("已更新");
    navigate("/desktop/scenic-news");
  };

  const set = (field: string, value: string) => setForm({ ...form, [field]: value });

  return (
    <FormPage title="编辑景区资讯" backPath="/desktop/scenic-news" onSave={handleSave} saving={saving}>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">标题</label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">分类</label>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">标签</label>
          <Input value={form.tag} onChange={(e) => set("tag", e.target.value)} placeholder="如 公告、热门活动" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">标签颜色</label>
          <Input value={form.tagColor} onChange={(e) => set("tagColor", e.target.value)} placeholder="#3B82F6" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">发布日期</label>
          <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">封面图 URL</label>
          <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">大标题（可选）</label>
          <Input value={form.heroTitle} onChange={(e) => set("heroTitle", e.target.value)} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">摘要</label>
          <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={2} />
        </div>
        <div className="col-span-2 space-y-1.5">
          <label className="text-sm font-medium">正文内容（每行一段）</label>
          <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} rows={6} placeholder="请输入正文内容，每行一段" />
        </div>
      </div>
    </FormPage>
  );
}
