const badgeMeta: Record<string, { label: string; color: string }> = {
  热门活动: { label: "热门活动", color: "var(--badge-hot)" },
  优惠: { label: "优惠", color: "var(--badge-sale)" },
  文化活动: { label: "文化活动", color: "var(--badge-culture)" },
  志愿服务: { label: "志愿服务", color: "var(--badge-volunteer)" },
  公告: { label: "公告", color: "var(--badge-notice)" },
}

export function getBadge(type: string, title: string): { label: string; color: string } {
  if (badgeMeta[type]) return badgeMeta[type]
  if (title.includes("文化节") || title.includes("活动") || title.includes("攻略")) return badgeMeta["热门活动"]
  if (title.includes("优惠") || title.includes("促销") || title.includes("券") || title.includes("备案"))
    return badgeMeta["优惠"]
  if (title.includes("文化") || title.includes("体验") || title.includes("非遗")) return badgeMeta["文化活动"]
  if (title.includes("志愿") || title.includes("招募") || title.includes("服务")) return badgeMeta["志愿服务"]
  return badgeMeta["公告"]
}
