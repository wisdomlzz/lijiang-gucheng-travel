import { useMemo, useState } from "react";
import { BarChart3, Clock3, Globe2, LineChart, MonitorSmartphone, MousePointerClick } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "../../../shared/components/ui/badge";
import { Button } from "../../../shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/components/ui/card";
import { Progress } from "../../../shared/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "../../../shared/components/ui/tabs";
import { PageLayout } from "../../components/common/PageLayout";

type RangeKey = "day" | "month" | "year";
type PlatformKey = "all" | "website" | "miniapp";

const rangeLabels: Record<RangeKey, string> = {
  day: "日",
  month: "月",
  year: "年",
};

const platformLabels: Record<PlatformKey, string> = {
  all: "官网+小程序",
  website: "官网",
  miniapp: "小程序",
};

const siteTotals = [
  { name: "官网", value: 186420, color: "#2563eb" },
  { name: "小程序", value: 263780, color: "#16a34a" },
];

const columnVisits: Record<RangeKey, Array<{ name: string; website: number; miniapp: number }>> = {
  day: [
    { name: "导游导览", website: 2860, miniapp: 5230 },
    { name: "购在古城", website: 1640, miniapp: 3420 },
    { name: "便民信息", website: 1320, miniapp: 2980 },
    { name: "文化院落", website: 1180, miniapp: 2260 },
    { name: "停车服务", website: 940, miniapp: 2110 },
    { name: "景区资讯", website: 1520, miniapp: 1840 },
  ],
  month: [
    { name: "导游导览", website: 68500, miniapp: 128400 },
    { name: "购在古城", website: 42600, miniapp: 87500 },
    { name: "便民信息", website: 38200, miniapp: 74200 },
    { name: "文化院落", website: 31900, miniapp: 56300 },
    { name: "停车服务", website: 24600, miniapp: 49800 },
    { name: "景区资讯", website: 35400, miniapp: 43100 },
  ],
  year: [
    { name: "导游导览", website: 822000, miniapp: 1540800 },
    { name: "购在古城", website: 511200, miniapp: 1050000 },
    { name: "便民信息", website: 458400, miniapp: 890400 },
    { name: "文化院落", website: 382800, miniapp: 675600 },
    { name: "停车服务", website: 295200, miniapp: 597600 },
    { name: "景区资讯", website: 424800, miniapp: 517200 },
  ],
};

const hourlyHeat = [
  { hour: "06:00", website: 420, miniapp: 760 },
  { hour: "08:00", website: 920, miniapp: 1420 },
  { hour: "10:00", website: 1680, miniapp: 2360 },
  { hour: "12:00", website: 1420, miniapp: 2680 },
  { hour: "14:00", website: 1880, miniapp: 3120 },
  { hour: "16:00", website: 2120, miniapp: 3460 },
  { hour: "18:00", website: 1560, miniapp: 2980 },
  { hour: "20:00", website: 1180, miniapp: 2140 },
];

const latestColumns = [
  { name: "景点", website: 1620, miniapp: 2860 },
  { name: "文艺院落", website: 980, miniapp: 1760 },
  { name: "服务", website: 720, miniapp: 1540 },
  { name: "停车", website: 640, miniapp: 2110 },
  { name: "洗手台", website: 420, miniapp: 820 },
  { name: "厕所", website: 580, miniapp: 1390 },
  { name: "应急避难", website: 210, miniapp: 460 },
  { name: "餐饮", website: 860, miniapp: 1820 },
  { name: "住宿", website: 740, miniapp: 1260 },
  { name: "酒吧", website: 690, miniapp: 980 },
  { name: "出入口", website: 360, miniapp: 740 },
];

function totalByPlatform(row: { website: number; miniapp: number }, platform: PlatformKey) {
  if (platform === "website") return row.website;
  if (platform === "miniapp") return row.miniapp;
  return row.website + row.miniapp;
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN");
}

export default function DataAnalysisPage() {
  const [range, setRange] = useState<RangeKey>("day");
  const [platform, setPlatform] = useState<PlatformKey>("all");

  const columnData = useMemo(() => {
    return columnVisits[range]
      .map((item) => ({
        ...item,
        total: totalByPlatform(item, platform),
      }))
      .sort((a, b) => b.total - a.total);
  }, [platform, range]);

  const totalVisits = siteTotals.reduce((sum, item) => sum + item.value, 0);
  const hotColumn = columnData[0];
  const hotHour = [...hourlyHeat].sort((a, b) => totalByPlatform(b, platform) - totalByPlatform(a, platform))[0];
  const maxLatest = Math.max(...latestColumns.map((item) => totalByPlatform(item, platform)));

  return (
    <PageLayout title="访问统计" description="按旧版后台口径统计官网和小程序各栏目访问、站点累计访问量、热门栏目和热门访问时段。">
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">站点累计访问量</span>
                <MousePointerClick className="size-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(totalVisits)}</div>
              <div className="mt-1 text-xs text-muted-foreground">官网 + 小程序累计</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">官网访问量</span>
                <Globe2 className="size-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(siteTotals[0].value)}</div>
              <div className="mt-1 text-xs text-muted-foreground">占比 {Math.round((siteTotals[0].value / totalVisits) * 100)}%</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">小程序访问量</span>
                <MonitorSmartphone className="size-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{formatNumber(siteTotals[1].value)}</div>
              <div className="mt-1 text-xs text-muted-foreground">占比 {Math.round((siteTotals[1].value / totalVisits) * 100)}%</div>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">当前热门栏目</span>
                <BarChart3 className="size-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold">{hotColumn.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{rangeLabels[range]}访问 {formatNumber(hotColumn.total)}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg">
          <CardHeader className="gap-3 pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-sm">热门栏目访问量统计</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Tabs value={range} onValueChange={(value) => setRange(value as RangeKey)}>
                  <TabsList className="rounded-lg">
                    <TabsTrigger value="day" className="rounded-md">日</TabsTrigger>
                    <TabsTrigger value="month" className="rounded-md">月</TabsTrigger>
                    <TabsTrigger value="year" className="rounded-md">年</TabsTrigger>
                  </TabsList>
                </Tabs>
                <Tabs value={platform} onValueChange={(value) => setPlatform(value as PlatformKey)}>
                  <TabsList className="rounded-lg">
                    <TabsTrigger value="all" className="rounded-md">全部</TabsTrigger>
                    <TabsTrigger value="website" className="rounded-md">官网</TabsTrigger>
                    <TabsTrigger value="miniapp" className="rounded-md">小程序</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ width: "100%", height: 290 }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={columnData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  {platform !== "miniapp" ? <Bar dataKey="website" name="官网" fill="#2563eb" radius={[4, 4, 0, 0]} /> : null}
                  {platform !== "website" ? <Bar dataKey="miniapp" name="小程序" fill="#16a34a" radius={[4, 4, 0, 0]} /> : null}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">热门访问时段统计</CardTitle>
                <Badge variant="outline">{platformLabels[platform]}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ReLineChart data={hourlyHeat}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    {platform !== "miniapp" ? <Line type="monotone" dataKey="website" name="官网" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} /> : null}
                    {platform !== "website" ? <Line type="monotone" dataKey="miniapp" name="小程序" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} /> : null}
                  </ReLineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                当前筛选下访问热度最高时段为 {hotHour.hour}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-sm">站点来源分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ width: "100%", height: 210 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie data={siteTotals} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>
                      {siteTotals.map((item) => <Cell key={item.name} fill={item.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-3">
                {siteTotals.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-medium">{formatNumber(item.value)}</span>
                    </div>
                    <Progress value={Math.round((item.value / totalVisits) * 100)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">导游导览栏目当日访问</CardTitle>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <LineChart className="size-3.5" />
                复用老版景点、文艺院落、服务、停车等导览栏目口径
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {latestColumns.map((item) => {
                const value = totalByPlatform(item, platform);
                return (
                  <div key={item.name} className="rounded-md border p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span>{formatNumber(value)}</span>
                    </div>
                    <Progress className="mt-2" value={Math.round((value / maxLatest) * 100)} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
