interface TabPageHeaderProps {
  title: string
}

export function TabPageHeader({ title }: TabPageHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-white border-b border-border-light">
      <div className="flex items-center justify-center h-[44px] px-4">
        <h1 className="text-[16px] font-semibold text-text-body">{title}</h1>
      </div>
    </div>
  )
}
