---
version: alpha
name: 丽江古城游
description: 温暖、大气的旅游服务平台。以丽江蓝 (#2563EB) 作为单一品牌强调色，承载所有主按钮、搜索和链接。设计信任摄影和留白而非字体重量——古城实景图承载视觉层级，PingFang SC + Inter 以适中字重运行。圆角 pill 搜索栏、柔和的卡片圆角、48px CTA 按钮——整体感受友好、人性化、有古城温度。
source: 参考 Airbnb DESIGN.md，适配丽江古城游品牌
---

colors:
primary: "#2563EB"
primary-active: "#1D4ED8"
primary-disabled: "#DBEAFE"
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

typography:
display:
fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
fontSize: 24px
fontWeight: 700
lineHeight: 1.3
letterSpacing: 0.02em
h1:
fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
fontSize: 18px
fontWeight: 600
lineHeight: 1.35
letterSpacing: 0
h2:
fontFamily: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
fontSize: 15px
fontWeight: 500
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

丽江古城游是一个照片驱动、温暖大气的旅游服务平台。基础画布是 **纯白** (`{colors.canvas}`) 和 **暖色调页面背景** (`{colors.surface-page} — #EFF6FC`)，以单一点的 **丽江蓝** (`{colors.primary} — #2563EB`) 承载所有主 CTA 按钮。没有第二个品牌色——蓝+白+温暖图片就是全部。

字体运行 **PingFang SC** (中文) + **Inter** (数字/英文)。Display 标题在 24-26px / 700，正文在 14px / 400。设计信任古城实景摄影的视觉重量，而非字体的肌肉感。

形状语言是**柔和的**。卡片 16px 圆角、按钮 12px 圆角、搜索栏 pill、头像 full circle。不存在直角——每个可交互元素都是圆角。

**Key Design Philosophy (继承 Airbnb):**

- 单一强调色承载全部品牌时刻，90% 页面是白/蓝灰 + 一个蓝色瞬间
- 摄影承担视觉层级的重量，文字保持适中克制
- Pill 形状和柔和圆角 = 友好、人性化、温暖
- 留白慷慨但不过度——旅游平台需要足够的卡片密度
- 移动端 (390px) 为第一视口，桌面端自适应

## Colors

### Brand

- **丽江蓝** (`{colors.primary}` — #2563EB): 唯一的品牌色。用于主 CTA、链接、选中态、Tab 指示器
- **丽江蓝深** (`{colors.primary-active}` — #1D4ED8): 按下态、渐变深端
- **丽江蓝浅** (`{colors.primary-disabled}` — #DBEAFE): 禁用态浅色

### Surface

- **Canvas** (`{colors.canvas}` — #FFFFFF): 卡片表面、弹窗背景
- **Page** (`{colors.surface-page}` — #EFF6FC): C端/B端页面背景，带微蓝色温
- **Soft** (`{colors.surface-soft}` — #F8FAFC): 桌面端页面背景

### Text

- **Ink** (`{colors.ink}` — #1E293B): 标题、重要文字。不是纯黑
- **Body** (`{colors.body}` — #334155): 正文
- **Muted** (`{colors.muted}` — #64748B): 次要说明
- **Muted Soft** (`{colors.muted-soft}` — #94A3B8): 占位、禁用文字

### Semantic

- **Success** (`{colors.success}` — #22C55E): 完成、微信绿
- **Warning** (`{colors.warning}` — #F59E0B): 待操作、待支付
- **Danger** (`{colors.danger}` — #EF4444): 错误、退款、删除
- **Info** (`{colors.info}` — #8B5CF6): 紫色信息标签

## Typography

### Font Stack

- **中文**: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **数字/英文**: `"Inter", "SF Pro Display", -apple-system, sans-serif`
- **等宽**: `"SF Mono", "Menlo", "Consolas", monospace`

### Hierarchy (Mobile / 390px)

| Token                  | Size | Weight | Line Height | Use                    |
| ---------------------- | ---- | ------ | ----------- | ---------------------- |
| `{typography.display}` | 24px | 700    | 1.3         | 登录页标题、大模块标题 |
| `{typography.h1}`      | 18px | 600    | 1.35        | 页面标题               |
| `{typography.h2}`      | 15px | 500    | 1.4         | 区块标题、卡片标题     |
| `{typography.body}`    | 14px | 400    | 1.5         | 正文、列表项、表格     |
| `{typography.caption}` | 12px | 400    | 1.4         | 辅助文字、时间、标签   |
| `{typography.tiny}`    | 11px | 400    | 1.3         | 角标、提示             |
| `{typography.badge}`   | 10px | 500    | 1.2         | 徽章文字               |
| `{typography.number}`  | 18px | 600    | 1.2         | 金额、统计数字         |

### Hierarchy (Desktop / 1440px+)

| Token                          | Size | Weight | Line Height | Use          |
| ------------------------------ | ---- | ------ | ----------- | ------------ |
| `{typography.desktop-display}` | 36px | 700    | 1.2         | 登录页大标题 |
| `{typography.desktop-h1}`      | 24px | 700    | 1.3         | 页面标题     |
| `{typography.desktop-body}`    | 14px | 400    | 1.5         | 表格、正文   |

### Principles

- 数字/金额用 Inter 字体，带 -0.01em 微调
- 中文标题 tracking +0.02em，正文 0
- 移动端字号不超过 4 个层级
- 桌面端数据表格用 13-14px

## Layout

### Spacing (4px 栅格)

- **Tokens:** `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 12px · `{spacing.base}` 16px · `{spacing.lg}` 24px · `{spacing.xl}` 32px · `{spacing.section}` 48px
- **移动端内容区:** px-4 (16px) 或 px-6 (24px) 水平边距
- **卡片间距:** 12-16px (mt-3 to mt-4)
- **卡片内边距:** 16px (p-4)

### Mobile Viewport (390×844)

- C端 + B端统一使用 MiniProgramFrame 手机模拟框
- 底部 Tab 栏高度: 56px
- 最小触摸区域: 44px

### Desktop Viewport (≥1024px)

- 侧边栏宽度: 240px
- 内容区 padding: 24px (p-6)
- 最大内容宽度: ~1400px

## Elevation

系统有**三个阴影层级**：

- **Level 1 — 卡片浮起:** `0 2px 12px rgba(0,0,0,0.04)` — 普通卡片
- **Level 2 — 强调卡片:** `0 4px 20px rgba(59,130,246,0.08)` — 特色入口、主按钮
- **Level 3 — 微信按钮:** `0 4px 14px rgba(7,193,96,0.25)` — 微信绿专用
- **Mobile 外壳:** `0 20px 50px rgba(60,120,200,0.18)` — 手机模拟框

95% 的表面使用 Level 1 或 flat。阴影是蓝色调的，不是纯黑——与品牌色呼应。

## Responsive Behavior

| 端        | 宽度       | 适配            |
| --------- | ---------- | --------------- |
| C端小程序 | 390px 固定 | 手机模拟框内    |
| B端小程序 | 390px 固定 | 手机模拟框内    |
| 桌面端    | ≥1024px    | 侧边栏 + 内容区 |

### Touch Targets

- 主按钮最小 48×48px (WCAG AAA)
- 移动端所有可点击元素 ≥ 44px
- 图标按钮 32-40px 圆形，带 8-12px padding 补偿

## Component Patterns

### Buttons (Do's and Don'ts)

| ✅ Do                                | ❌ Don't           |
| ------------------------------------ | ------------------ |
| 主按钮带蓝色投影 `shadow-primary/20` | 纯色无投影按钮     |
| `active:scale-[0.98]` 点击缩放反馈   | 无反馈的僵硬按钮   |
| 微信按钮用专用绿色 `#07C160`         | 其他颜色做微信登录 |
| 禁用态 `opacity-40`                  | 灰色覆盖层禁用     |
| 48-50px 高度 (移动端)                | < 44px 的触摸目标  |

### Cards (Do's and Don'ts)

| ✅ Do                           | ❌ Don't       |
| ------------------------------- | -------------- |
| `rounded-2xl` (16px) 移动端卡片 | 直角卡片       |
| 单卡片最大一层嵌套              | 多层卡片嵌套   |
| 柔和蓝色调阴影                  | 黑色重阴影     |
| 卡片间 12-16px 间距             | 卡片紧贴无留白 |

### Typography (Do's and Don'ts)

| ✅ Do                       | ❌ Don't           |
| --------------------------- | ------------------ |
| `#1E293B` 作为最深文字色    | `#000000` 纯黑文字 |
| 最多 4 种字号/页面 (移动端) | 5+ 种字号混用      |
| 数字用 Inter 字体           | 中文匹配数字       |
| 行高 1.4-1.5 正文           | 紧凑无行高         |

### Inputs (Do's and Don'ts)

| ✅ Do                                       | ❌ Don't             |
| ------------------------------------------- | -------------------- |
| `bg-[#F5F5F5]` 默认态                       | 白色输入框无背景区分 |
| focus: `bg-white + ring-2 + border-primary` | 无 focus 态          |
| `rounded-xl` 12px                           | 直角输入框           |
| 48px 高度                                   | < 44px               |

## Anti-Patterns (通用禁止)

| ❌ Never               | ✅ Always                          |
| ---------------------- | ---------------------------------- |
| 纯黑 `#000` 文字       | `#1E293B` (ink)                    |
| 直角 (0px radius)      | ≥ 8px 圆角                         |
| 无投影彩色按钮         | 主按钮带品牌色投影                 |
| 大段文字无行高         | line-height 1.4-1.6                |
| 无过渡直接切换         | ≥ opacity 过渡 0.2-0.3s            |
| 文字颜色超过 4 种/页面 | 严格使用 ink/body/muted/muted-soft |
| 图片无渐变遮罩         | 文字叠加图片时用渐变保证可读性     |
| 纯灰 `#CCC` 边框       | `#E5E5E5` 或 `#F3F3F3`             |

## Agent Prompt Guide

快速参考，可直接用于 AI Agent:

```
Design System: 丽江古城游 (Airbnb-adapted)
Primary: #2563EB (blue), Success: #22C55E, Warning: #F59E0B, Danger: #EF4444
Font: PingFang SC (Chinese) + Inter (numbers/English), 11-24px mobile
Radius: cards=16px, buttons=12px, inputs=12px, pills=full
Spacing: 4px grid, px-4/p-6 standard padding
Button: h-12 (48px), active:scale-[0.98], shadow colored
Card: bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]
Input: bg-[#F5F5F5] rounded-xl h-12, focus:bg-white focus:ring-2 focus:border-primary
Animation: fade-in + slide-up 0.3-0.6s ease-out
Mobile: 390×844 viewport, min touch 44px
Photography: use Lijiang scenery images, multi-layer gradient overlays
```
