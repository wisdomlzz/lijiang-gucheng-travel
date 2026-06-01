import { Award } from "lucide-react"

interface TrustScoreBadgeProps {
  score: number
  status: string
  size?: "sm" | "md" | "lg"
}

export function TrustScoreBadge({ score, status, size = "sm" }: TrustScoreBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-0.5",
    md: "text-xs px-2 py-1 gap-1",
    lg: "text-sm px-2.5 py-1 gap-1",
  }

  const isNormal = status === "正常"
  const bgColor = isNormal ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bgColor} ${sizeClasses[size]}`}>
      <Award size={10} />
      {score}分
    </span>
  )
}
