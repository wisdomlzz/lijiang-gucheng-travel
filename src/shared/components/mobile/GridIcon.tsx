const GRADIENTS = [
  "from-orange-300 to-rose-400",
  "from-emerald-300 to-teal-400",
  "from-sky-300 to-blue-400",
  "from-amber-300 to-yellow-400",
  "from-violet-300 to-purple-400",
  "from-cyan-300 to-blue-400",
  "from-lime-300 to-green-400",
  "from-pink-300 to-rose-400",
]

interface GridIconProps {
  imageUrl?: string
  label: string
  gradientIndex?: number
  size?: "sm" | "md"
}

export function GridIcon({ imageUrl, label, gradientIndex = 0, size = "md" }: GridIconProps) {
  const gradient = GRADIENTS[gradientIndex % GRADIENTS.length]
  const containerSize = size === "sm" ? "w-[48px] h-[48px]" : "w-[52px] h-[52px]"
  return (
    <div
      className={`${containerSize} rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} shadow-card flex items-center justify-center`}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="w-full h-full object-contain p-1.5 drop-shadow-sm" loading="lazy" />
      ) : (
        <span className="text-[20px] font-semibold text-white/90">{label.charAt(0)}</span>
      )}
    </div>
  )
}
