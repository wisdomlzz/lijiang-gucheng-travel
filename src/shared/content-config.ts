import type { Merchant } from "./types/content-types";

export const touristServiceMenuOrder = [
  "party-member",
  "handwash",
  "service-points",
  "attractions",
  "emergency-shelter",
  "parking",
  "courtyards",
  "toilets",
  "hotels",
  "restaurants",
  "shopping",
  "bars",
  "smoking-area",
  "entrances",
] as const;

export type MerchantCategoryCode = "food" | "hotel" | "bar" | "shopping";

export const merchantCategoryLabels: Record<MerchantCategoryCode, string> = {
  food: "餐饮",
  hotel: "住宿",
  bar: "酒吧",
  shopping: "购物",
};

export const merchantCategoryRouteMap: Record<MerchantCategoryCode, string> = {
  food: "restaurants",
  hotel: "hotels",
  bar: "bars",
  shopping: "shopping",
};

export const merchantCategoryDesktopTitleMap: Record<MerchantCategoryCode, string> = {
  food: "餐饮",
  hotel: "酒店（住宿）",
  bar: "酒吧",
  shopping: "购物",
};

export function normalizeMerchantCategory(category: string): MerchantCategoryCode {
  switch (category) {
    case "food":
    case "hotel":
    case "bar":
    case "shopping":
      return category;
    case "culture":
      return "shopping";
    default:
      return "shopping";
  }
}

export function getMerchantCategoryFromRouteKey(routeKey: string): MerchantCategoryCode {
  return (
    Object.entries(merchantCategoryRouteMap).find(([, key]) => key === routeKey)?.[0] ??
    "shopping"
  ) as MerchantCategoryCode;
}

export function getMerchantCategoryLabel(category: string): string {
  return merchantCategoryLabels[normalizeMerchantCategory(category)];
}

export function getMerchantRouteKey(category: string): string {
  return merchantCategoryRouteMap[normalizeMerchantCategory(category)];
}

export function getMerchantRoutePath(category: string): string {
  return `/desktop/${getMerchantRouteKey(category)}`;
}

export function filterMerchantsByCategory<T extends Pick<Merchant, "category">>(
  merchants: T[],
  category?: MerchantCategoryCode,
) {
  if (!category) return merchants;
  return merchants.filter((merchant) => normalizeMerchantCategory(merchant.category) === category);
}
