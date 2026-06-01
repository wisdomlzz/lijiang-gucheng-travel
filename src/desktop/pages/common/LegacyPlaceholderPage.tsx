import { PageLayout } from "../../components/common/PageLayout"
import { Button } from "../../../shared/components/ui/button"
import { ExternalLink } from "lucide-react"

interface LegacyPlaceholderPageProps {
  title: string
  description?: string
}

export function LegacyPlaceholderPage({ title, description }: LegacyPlaceholderPageProps) {
  return (
    <PageLayout title={title} description={description}>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18" />
            <path d="M9 21V9" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-text-heading mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground mb-1">当前模块为演示占位页</p>
        <p className="text-xs text-muted-foreground mb-8 max-w-sm">
          完整功能请跳转至云南丽江游老管理平台操作。本地为演示环境，数据仅供参考。
        </p>
        <Button
          className="gap-2"
          onClick={() => window.open("https://www.lijiangoldtown.com/admin", "_blank")}
        >
          <ExternalLink className="size-4" />
          跳转至老管理平台
        </Button>
      </div>
    </PageLayout>
  )
}