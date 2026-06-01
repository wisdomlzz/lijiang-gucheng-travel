import { cn } from "../../shared/components/ui/utils";

type Step = { label: string; completed: boolean };

export function StatusProgress({ steps }: { steps: Step[] }) {
  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((step, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
          <div className="flex items-center w-full">
            {idx > 0 && (
              <div className={cn("h-0.5 flex-1", step.completed ? "bg-primary" : "bg-muted")} />
            )}
            <div
              className={cn(
                "size-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                step.completed
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
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
  );
}
