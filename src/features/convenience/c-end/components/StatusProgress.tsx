import { cn } from "../../../../shared/components/ui/utils"

type Step = { label: string; completed: boolean }

export function StatusProgress({ steps, compact = false }: { steps: Step[]; compact?: boolean }) {
  if (compact) {
    const completedCount = steps.filter((s) => s.completed).length
    const totalWidth = 100 // percent
    const circleWidth = 10 // percent per circle
    const progressPercent =
      steps.length > 1 ? ((completedCount - 1) / (steps.length - 1)) * (totalWidth - circleWidth) : 0

    return (
      <div className="relative w-full">
        {/* 连接线背景 */}
        <div className="absolute top-[10px] left-[10px] right-[10px] h-0.5 bg-muted rounded-full" />
        {/* 已完成进度线 */}
        <div
          className="absolute top-[10px] left-[10px] h-0.5 bg-primary rounded-full transition-all"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="flex items-start justify-between">
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-medium",
                  step.completed ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {step.completed ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "text-[8px] mt-0.5 text-center leading-tight w-10",
                  step.completed ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center w-full">
            {idx > 0 && <div className={cn("h-0.5 flex-1", step.completed ? "bg-primary" : "bg-muted")} />}
            <div
              className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                step.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {step.completed ? "✓" : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={cn("h-0.5 flex-1", steps[idx + 1].completed ? "bg-primary" : "bg-muted")} />
            )}
          </div>
          <span className={cn("text-[10px]", step.completed ? "text-primary font-medium" : "text-muted-foreground")}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
