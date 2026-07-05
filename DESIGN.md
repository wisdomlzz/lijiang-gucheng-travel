---
version: alpha
name: 丽江古城游
description: 以「丽江蓝天」为主调的旅游服务平台。C 端小程序首页采用通顶蓝空头图 + 白云搜索栏 + 圆角白卡的组合，营造「在古城蓝天下旅行」的氛围；桌面端保持克制、信息优先。整体颜色以 #2563EB 丽江蓝为锚点，辅以天空浅蓝与暖白，图标与摄影承担视觉层级，文字保持清晰易读。
source: 参考丽江古城游 UI 图与 Airbnb DESIGN.md
---

colors:
  primary: "#2563EB"
  primary-active: "#1D4ED8"
  primary-disabled: "#DBEAFE"
  sky-deep: "#2563EB"
  sky-mid: "#3B82F6"
  sky-light: "#60A5FA"
  sky-50: "#EFF6FC"
  sky-100: "#DBEAFE"
  ink: "#1E293B"
  body: "#334155"
  muted: "#64748B"
  muted-soft: "#94A3B8"
  hairline: "#E5E5E5"
  hairline-soft: "#F3F3F3"
  border-strong: "#CBD5E1"
  canvas: "#FFFFFF"
  surface-page: "#EFF6FC"
  surface-soft: "#F8FAFC"
  surface-card: "#FFFFFF"
  surface-strong: "#F1F5F9"
  on-primary: "#FFFFFF"
  on-dark: "#FFFFFF"
  success: "#22C55E"
  warning: "#F59E0B"
  danger: "#EF4444"
  info: "#8B5CF6"
  wechat-green: "#07C160"
  score-gold: "#F59E0B"
  scrim: "#000000"
  badge-hot: "#10B981"
  badge-sale: "#F59E0B"
  badge-culture: "#8B5CF6"
  badge-notice: "#F97316"
  badge-volunteer: "#3B82F6"

header-gradient: "linear-gradient(180deg, #3B82F6 0%, #60A5FA 55%, #EFF6FC 100%)"

shadows:
  card: "0 2px 12px rgba(0,0,0,0.04)"
  elevated: "0 8px 24px rgba(59,130,246,0.10)"
  primary-button: "0 4px 20px rgba(37,99,235,0.20)"
  ai-avatar: "0 6px 22px rgba(37,99,235,0.45)"

mobile-shell-shadow: "0 20px 50px rgba(60,120,200,0.18), 0 8px 20px rgba(60,120,200,0.10)"

typography:
  display:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0.02em
  hero-title:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 0.2em
  h1:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0
  h2:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0
  body:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0
  caption:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  tiny:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: 0
  badge:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 10px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0
  button:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0
  number:
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  desktop-display:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  desktop-h1:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0
  desktop-body:
    fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0

rounded:
  none: 0px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px

spacing:
  xxs: 2px
  xs: 4px
  sm: 8px
  md: 12px
  base: 16px
  lg: 24px
  xl: 32px
  section: 48px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 48px
    shadow: "{shadows.primary-button}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    transform: "scale(0.98)"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted-soft}"
    rounded: "{rounded.md}"
  button-wechat:
    backgroundColor: "{colors.wechat-green}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: 14px 24px
    height: 50px
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: 12px 24px
    height: 48px
    border: "1px solid {colors.hairline}"
  card-mobile:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 16px
    shadow: "{shadows.card}"
  card-desktop:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
    border: "1px solid {colors.hairline-soft}"
  text-input:
    backgroundColor: "#F5F5F5"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: 12px 16px
    height: 48px
  text-input-focus:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.primary}"
    ringWidth: 2px
  status-badge:
    rounded: "{rounded.full}"
    padding: 2px 8px
    typography: "{typography.badge}"
  sheet-mobile:
    backgroundColor: "{colors.canvas}"
    rounded: "{rounded.xl}"
    padding: 20px

---

## Overview

丽江古城游是一个**照片驱动、氛围温暖**的旅游服务平台。C 端小程序首页以「蓝天古城头图」开场：状态栏融入蓝色渐变，搜索栏像一片白云悬浮在头图底部，下方由圆角白卡承载宫格、攻略与资讯。桌面端则回归信息密度与操作效率，使用白卡 + 侧边栏的清晰结构。

品牌色是 **丽江蓝** (`{colors.primary}` — #2563EB)，辅以天空浅蓝 (`{colors.sky-light}` — #60A5FA) 做渐变与高光。文字最深只用 `{colors.ink}` (#1E293B)，不使用纯黑。形状语言保持柔和：卡片 16px 圆角、按钮 12px 圆角、搜索栏 pill、头像 full circle。

### 设计哲学

- **一个视觉锚点**：C 端首页的通顶蓝空头图 + 古城摄影，营造「丽江蓝天下」的第一印象。
- **一个交互锚点**：底部 Tab 中央的 AI 旅伴头像始终凸起，成为可识别的品牌符号。
- **摄影承担层级**：古城实景图负责视觉重量，文字保持克制。
- **克制用色**：90% 的界面是白/蓝灰/蓝，彩色仅用于状态徽章和宫格渐变图标。

## Colors

### Brand

- **丽江蓝** (`{colors.primary}` — #2563EB): 主 CTA、选中态、Tab 指示器、核心链接。
- **天空中蓝** (`{colors.sky-mid}` — #3B82F6): 头图渐变、强调卡片投影色调。
- **天空浅蓝** (`{colors.sky-light}` — #60A5FA): 渐变亮部、hover 高光、聚焦环。
- **丽江蓝深** (`{colors.primary-active}` — #1D4ED8): 按下态。
- **丽江蓝浅** (`{colors.primary-disabled}` — #DBEAFE): 禁用态浅色。

### Atmosphere

- **Header gradient** (`{header-gradient}`): `linear-gradient(180deg, #3B82F6 0%, #60A5FA 55%, #EFF6FC 100%)` — C 端首页通顶头图。

### Surface

- **Canvas** (`{colors.canvas}` — #FFFFFF): 卡片表面、弹窗背景、搜索栏。
- **Page** (`{colors.surface-page}` — #EFF6FC): C 端/B 端页面背景，带微蓝色温。
- **Soft** (`{colors.surface-soft}` — #F8FAFC): 桌面端页面背景。

### Text

- **Ink** (`{colors.ink}` — #1E293B): 标题、重要文字。
- **Body** (`{colors.body}` — #334155): 正文。
- **Muted** (`{colors.muted}` — #64748B): 次要说明。
- **Muted Soft** (`{colors.muted-soft}` — #94A3B8): 占位、禁用文字。

### Semantic

- **Success** (`{colors.success}` — #22C55E): 完成、微信绿。
- **Warning** (`{colors.warning}` — #F59E0B): 待操作、待支付。
- **Danger** (`{colors.danger}` — #EF4444): 错误、退款、删除。
- **Info** (`{colors.info}` — #8B5CF6): 紫色信息标签。

### Type badges

- **热门活动** (`{colors.badge-hot}` — #10B981)
- **优惠** (`{colors.badge-sale}` — #F59E0B)
- **文化活动** (`{colors.badge-culture}` — #8B5CF6)
- **公告** (`{colors.badge-notice}` — #F97316)
- **志愿服务** (`{colors.badge-volunteer}` — #3B82F6)

## Typography

### Font Stack

- **中文**: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **数字/英文**: `"Inter", "SF Pro Display", -apple-system, sans-serif`
- **等宽**: `"SF Mono", "Menlo", "Consolas", monospace`

### Hierarchy (Mobile / 390px)

| Token                         | Size  | Weight | Line Height | Use                      |
| ----------------------------- | ----- | ------ | ----------- | ------------------------ |
| `{typography.display}`        | 24px  | 700    | 1.3         | 登录页标题、大模块标题   |
| `{typography.hero-title}`     | 20px  | 600    | 1.2         | 首页头图品牌标题         |
| `{typography.h1}`             | 18px  | 600    | 1.35        | 页面标题                 |
| `{typography.h2}`             | 15px  | 600    | 1.4         | 区块标题、卡片标题       |
| `{typography.body}`           | 14px  | 400    | 1.5         | 正文、列表项、表格       |
| `{typography.caption}`        | 12px  | 400    | 1.4         | 辅助文字、时间、标签     |
| `{typography.tiny}`           | 11px  | 400    | 1.3         | 角标、提示               |
| `{typography.badge}`          | 10px  | 500    | 1.2         | 徽章文字                 |
| `{typography.number}`         | 18px  | 600    | 1.2         | 金额、统计数字           |

### Hierarchy (Desktop / 1440px+)

| Token                          | Size | Weight | Line Height | Use          |
| ------------------------------ | ---- | ------ | ----------- | ------------ |
| `{typography.desktop-display}` | 36px | 700    | 1.2         | 登录页大标题 |
| `{typography.desktop-h1}`      | 24px | 700    | 1.3         | 页面标题     |
| `{typography.desktop-body}`    | 14px | 400    | 1.5         | 表格、正文   |

### Principles

- 数字/金额用 Inter 字体，带 -0.01em 微调。
- 中文标题 tracking +0.02em（头图标题可放宽到 +0.15–0.2em）。
- 移动端字号不超过 4 个层级/页面。
- 桌面端数据表格用 13–14px。

## Layout

### Spacing (4px 栅格)

- **Tokens:** `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.section}` 48px
- **移动端内容区:** px-4 (16px) 或 px-6 (24px) 水平边距
- **卡片间距:** 12–16px (mt-3 to mt-4)
- **卡片内边距:** 16px (p-4)

### Mobile Viewport (390×844)

- C端 + B端统一使用 MiniProgramFrame 手机模拟框。
- 首页状态栏融入头图，其他页面状态栏保持白底灰字。
- 底部 Tab 栏高度: 60px（含安全区）。
- 最小触摸区域: 44px。

### Desktop Viewport (≥1024px)

- 侧边栏宽度: 240px
- 内容区 padding: 24px (p-6)
- 最大内容宽度: ~1400px

## Elevation

系统有**三个阴影层级**：

- **Level 1 — 卡片浮起:** `{shadows.card}` (`0 2px 12px rgba(0,0,0,0.04)`) — 普通卡片、资讯项。
- **Level 2 — 强调卡片:** `{shadows.elevated}` (`0 8px 24px rgba(59,130,246,0.10)`) — 搜索栏、头图卡片、底部 AI 头像。
- **Level 3 — 微信/主按钮:** `{shadows.primary-button}` / 微信按钮专用。
- **Mobile 外壳:** `{mobile-shell-shadow}` — 手机模拟框。

95% 的表面使用 Level 1 或 flat。阴影是蓝色调的，不是纯黑。

## Responsive Behavior

| 端        | 宽度       | 适配            |
| --------- | ---------- | --------------- |
| C端小程序 | 390px 固定 | 手机模拟框内    |
| B端小程序 | 390px 固定 | 手机模拟框内    |
| 桌面端    | ≥1024px    | 侧边栏 + 内容区 |

### Touch Targets

- 主按钮最小 48×48px (WCAG AAA)
- 移动端所有可点击元素 ≥ 44px
- 图标按钮 32–40px 圆形，带 8–12px padding 补偿

## Component Patterns

### Buttons (Do's and Don'ts)

| ✅ Do                                      | ❌ Don't           |
| ------------------------------------------ | ------------------ |
| 主按钮带蓝色投影 `shadow-primary/20`       | 纯色无投影按钮     |
| `active:scale-[0.98]` 点击缩放反馈         | 无反馈的僵硬按钮   |
| 微信按钮用专用绿色 `#07C160`               | 其他颜色做微信登录 |
| 禁用态 `opacity-40`                        | 灰色覆盖层禁用     |
| 48–50px 高度 (移动端)                      | < 44px 的触摸目标  |

### Cards (Do's and Don'ts)

| ✅ Do                           | ❌ Don't       |
| ------------------------------- | -------------- |
| `rounded-2xl` (16px) 移动端卡片 | 直角卡片       |
| 单卡片最大一层嵌套              | 多层卡片嵌套   |
| 柔和蓝色调阴影                  | 黑色重阴影     |
| 卡片间 12–16px 间距             | 卡片紧贴无留白 |

### Inputs (Do's and Don'ts)

| ✅ Do                                       | ❌ Don't             |
| ------------------------------------------- | -------------------- |
| 搜索栏用白底 pill 形状                      | 无边框直角搜索框     |
| 右侧图标用线框风格                          | 实心图标抢占焦点     |
| `bg-[#F5F5F5]` 默认态（非搜索场景）         | 白色输入框无背景区分 |
| focus: `bg-white + ring-2 + border-primary` | 无 focus 态          |
| 48px 高度                                   | < 44px               |

### Home Page Composition

C 端首页的模块顺序与样式：

1. **通顶头图区**: `bg-gradient-to-b from-sky-mid via-sky-light to-surface-page`，状态栏透明、白字。头图卡片 `rounded-2xl aspect-[16/7] shadow-elevated`，中央叠加品牌标题与副标题。
2. **悬浮搜索栏**: 白底 pill，`h-[44px] shadow-elevated`，左侧搜索图标，右侧线框扫码按钮。
3. **宫格入口**: 4 列，图标 52×52px，`rounded-2xl` 彩色渐变背景，下方 12px 文字标签。
4. **推荐攻略**: 白卡 `rounded-2xl shadow-card`，标题带小图标，两列图片卡片，图片上叠加彩色标签。
5. **景区资讯**: 标题 + 查看更多，列表项为左图右文，图片左上角叠加类型徽章，底部显示日期与「查看详情」链接。

### Bottom Tab

- 背景：白色/95% 不透明度 + `backdrop-blur-xl`，顶部 1px 边框。
- 中央 AI 头像：56×56px 圆形，蓝渐变背景，白色 2.5px 边框，投影 `shadow-ai-avatar`。
- 普通 Tab：22px 图标 + 10px 标签，active 时图标与文字变为 `primary`。

## Anti-Patterns (通用禁止)

| ❌ Never               | ✅ Always                          |
| ---------------------- | ---------------------------------- |
| 纯黑 `#000` 文字       | `#1E293B` (ink)                    |
| 直角 (0px radius)      | ≥ 8px 圆角                         |
| 无投影彩色按钮         | 主按钮带品牌色投影                 |
| 大段文字无行高         | line-height 1.4–1.6                |
| 无过渡直接切换         | ≥ opacity 过渡 0.2–0.3s            |
| 文字颜色超过 4 种/页面 | 严格使用 ink/body/muted/muted-soft |
| 图片无渐变遮罩         | 文字叠加图片时用渐变保证可读性     |
| 纯灰 `#CCC` 边框       | `#E5E5E5` 或 `#F3F3F3`             |

## Agent Prompt Guide

快速参考，可直接用于 AI Agent:

```
Design System: 丽江古城游 (Lijiang-blue)
Primary: #2563EB (blue), Sky-mid: #3B82F6, Sky-light: #60A5FA
Header: linear-gradient(180deg, #3B82F6 0%, #60A5FA 55%, #EFF6FC 100%)
Font: PingFang SC (Chinese) + Inter (numbers/English), 10-24px mobile
Radius: cards=16px, buttons=12px, inputs=12px, pills=full, avatars=full
Spacing: 4px grid, px-4/p-6 standard padding
Text: ink=#1E293B, body=#334155, muted=#64748B, muted-soft=#94A3B8
Button: h-12, active:scale-[0.98], shadow colored
Card: bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]
Search: white pill h-11, shadow-[0_8px_24px_rgba(59,130,246,0.10)]
Input: bg-[#F5F5F5] rounded-xl h-12, focus:bg-white focus:ring-2 focus:border-primary
Animation: fade-in + slide-up 0.3-0.6s ease-out
Mobile: 390×844 viewport, min touch 44px
Photography: use Lijiang scenery images, multi-layer gradient overlays
Badges: 热门活动=#10B981, 优惠=#F59E0B, 文化活动=#8B5CF6, 公告=#F97316, 志愿服务=#3B82F6
Signature: blue-sky header + floating AI avatar in bottom tab
```
