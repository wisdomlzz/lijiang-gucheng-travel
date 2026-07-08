import { Search } from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { type TabKey, TABS } from "./tab-config"

interface TabNavigationProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  tabBadge: (key: TabKey) => number | undefined
}

export function TabNavigation({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  tabBadge,
}: TabNavigationProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TabKey)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="relative">
              {tab.label}
              {tabBadge(tab.key) && (
                <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                  {tabBadge(tab.key)}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="relative w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="搜索订单号、地址、人员..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>
    </div>
  )
}