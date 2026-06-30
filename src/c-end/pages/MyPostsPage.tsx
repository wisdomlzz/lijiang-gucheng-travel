import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback";
import { FileText, Eye, Clock, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useLoadMore } from "../../shared/hooks/useLoadMore";

type Tab = "info";

interface Post {
  id: string;
  type: "info";
  title: string;
  content: string;
  status: "pending" | "published" | "rejected";
  rejectReason?: string;
  views: number;
  likes: number;
  createdAt: string;
}

const mockPosts: Post[] = [
  {
    id: "p1", type: "info", title: "古城客栈招租信息",
    content: "五一街文生巷，独栋纳西庭院，三坊一照壁格局，适合做精品民宿...",
    status: "published", views: 230, likes: 12, createdAt: "2026-05-06"
  },
  {
    id: "p3", type: "info", title: "纳西手工刺绣体验课",
    content: "每周六下午在古城文化馆开课，由非遗传承人授课...",
    status: "rejected", rejectReason: "内容涉及商业推广，请修改后重新提交", views: 0, likes: 0, createdAt: "2026-05-07"
  },
];

const tabs: { key: Tab; label: string; count: number }[] = [
  { key: "info", label: "便民信息", count: 2 },
];

const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "审核中", color: "text-[#F59E0B]", bg: "bg-[#FEF3C7]" },
  published: { label: "已发布", color: "text-[#22C55E]", bg: "bg-[#DCFCE7]" },
  rejected: { label: "已拒绝", color: "text-[#EF4444]", bg: "bg-[#FEE2E2]" },
};

export function MyPostsPage() {
  const [tab, setTab] = useState<Tab>("info");
  const [posts, setPosts] = useState(mockPosts);

  const filtered = posts.filter(p => p.type === tab);
  const { visible, hasMore, loadMore } = useLoadMore(filtered, 6);

  const handleDelete = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast.success("已删除");
  };

  const handleResubmit = (id: string) => {
    toast.info("已重新提交审核");
  };

  return (
    <div className="min-h-full bg-surface-page">
      <PageHeader title="我的发布" back="/c/profile" />

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-surface-page px-3 pt-2 pb-2">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-1.5 rounded-full text-[13px] ${tab === t.key ? "bg-primary text-white" : "bg-white text-text-secondary"}`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-3 pb-6 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <FileText size={40} className="text-text-tertiary mb-3" />
            <p className="text-[13px] text-text-tertiary">暂无发布内容</p>
          </div>
        ) : (
          <>
            {visible.map(post => {
              const s = statusMeta[post.status];
              return (
                <div key={post.id} className="bg-white rounded-xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                    </div>
                    <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                      <Clock size={11} /> {post.createdAt}
                    </span>
                  </div>

                  <h3 className="text-[14px] text-text-body font-medium mb-1">{post.title}</h3>
                  <p className="text-[12px] text-text-tertiary line-clamp-2">{post.content}</p>

                  {post.status === "rejected" && post.rejectReason && (
                    <div className="mt-2 bg-red-50 rounded-lg px-3 py-2 text-[11px] text-red-600">
                      拒绝原因：{post.rejectReason}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-text-tertiary">
                      {post.status === "published" && (
                        <>
                          <span className="flex items-center gap-1"><Eye size={11} /> {post.views}</span>
                          <span className="flex items-center gap-1">❤️ {post.likes}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {post.status === "rejected" && (
                        <button onClick={() => handleResubmit(post.id)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary-50 text-primary text-[11px]">
                          <RotateCcw size={11} /> 重新提交
                        </button>
                      )}
                      <button onClick={() => handleDelete(post.id)} className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-text-secondary text-[11px]">
                        <Trash2 size={11} /> 删除
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <button
                onClick={loadMore}
                className="w-full h-10 rounded-full border border-primary text-primary text-[13px]"
              >
                加载更多
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
