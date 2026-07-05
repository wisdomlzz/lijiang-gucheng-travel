import { ReactNode } from "react"
import { useNavigate } from "react-router"
import { ChevronLeft } from "lucide-react"
import { Button } from "../../../shared/components/ui/button"

export function FormPage({
  title,
  backPath,
  children,
  onSave,
  saving,
}: {
  title: string
  backPath: string
  children: ReactNode
  onSave: () => void
  saving?: boolean
}) {
  const navigate = useNavigate()
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(backPath)}
          className="w-8 h-8 flex items-center justify-center -ml-1 active:scale-90 transition-transform"
        >
          <ChevronLeft size={18} className="text-muted-foreground" />
        </button>
        <h1 className="text-lg font-medium">{title}</h1>
      </div>
      <div className="space-y-6">{children}</div>
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button onClick={onSave} disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </Button>
        <Button variant="outline" onClick={() => navigate(backPath)}>
          取消
        </Button>
      </div>
    </div>
  )
}
