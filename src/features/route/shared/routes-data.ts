export const recommendRoutes = [
  {
    id: 1,
    routeId: "1",
    name: "古城漫步·非遗之旅",
    subtitle: "大水车 · 四方街 · 万古楼",
    tag: "深度游",
    tagColor: "#3B82F6",
    img: "https://images.unsplash.com/photo-1663609968423-657ff4f0dd5a?auto=format&fit=crop&w=600&q=70",
  },
  {
    id: 2,
    routeId: "2",
    name: "寻味古城·美食地图",
    subtitle: "忠义市场 · 五一街 · 樱花美食广场",
    tag: "吃货必选",
    tagColor: "#0EA5E9",
    img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=70",
  },
]

export type RecommendRoute = (typeof recommendRoutes)[number]
