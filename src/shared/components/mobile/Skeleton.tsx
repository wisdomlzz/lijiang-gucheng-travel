/** 单个灰色占位块 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-strong ${className}`} />
}

/** 列表项骨架：左图 + 右文 */
export function SkeletonListItem() {
  return (
    <div className="flex gap-3 p-3 bg-white rounded-2xl">
      <Skeleton className="w-[96px] h-[96px] flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/** 列表骨架页：N 个列表项 */
export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

/** 移动端整页骨架：顶部 header + 列表 */
export function PageSkeleton() {
  return (
    <div className="min-h-[400px] bg-surface-page">
      <div className="h-12 bg-white border-b border-border-light" />
      <SkeletonList count={5} />
    </div>
  )
}
