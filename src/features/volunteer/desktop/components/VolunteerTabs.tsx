import { motion } from "motion/react"

interface VolunteerTabsProps {
  tab: "volunteers" | "activities"
  onTabChange: (t: "volunteers" | "activities") => void
  pendingVolCount: number
}

export function VolunteerTabs({ tab, onTabChange, pendingVolCount }: VolunteerTabsProps) {
  return (
    <div className="flex items-center gap-6 mb-5 border-b border-slate-200">
      {(["activities", "volunteers"] as const).map((t) => (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          className={`relative pb-2.5 text-[13px] font-medium transition-colors ${
            tab === t ? "text-slate-800" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <span className="flex items-center gap-2">
            {t === "volunteers" ? "志愿者审核" : "活动管理"}
            {t === "volunteers" && pendingVolCount > 0 && (
              <span className="px-1.5 h-4 min-w-[16px] rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {pendingVolCount}
              </span>
            )}
          </span>
          {tab === t && (
            <motion.div
              layoutId="tab-indicator"
              className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-slate-800"
            />
          )}
        </button>
      ))}
    </div>
  )
}