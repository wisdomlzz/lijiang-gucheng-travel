import { useState, useRef, useEffect, useCallback } from "react"
import { Trash2, Send, Clock, MapPin, Star, Route, UtensilsCrossed, CalendarDays, Ticket, Headphones } from "lucide-react"
import { ImageWithFallback } from "@/shared/components/ui/image-with-fallback"
import { useNavigate } from "react-router"
import aiAvatar from "@/c-end/assets/ai-avatar-new.png"
import { CRMEB_C_URL } from "@/shared/constants"

/* ─────────────────────────────────────────────
   Types
──────────────────────────────────────────── */
interface RouteCard {
  id: string
  name: string
  image: string
  spots: number
  duration: string
  tags: string[]
}

interface MerchantCard {
  id: string
  name: string
  image: string
  tag: string
  rating: number
  distance: string
}

interface ProductCard {
  id: string
  name: string
  image: string
  price: string
  tag: string
}

interface Message {
  id: string
  role: "user" | "ai"
  text: string
  displayText: string
  cardType?: "route" | "merchant" | "product"
  cards?: (RouteCard | MerchantCard | ProductCard)[]
  isThinking: boolean
}

/* ─────────────────────────────────────────────
   Constants
──────────────────────────────────────────── */
const QUICK_SUGGESTIONS = [
  { label: "线路推荐", icon: Route },
  { label: "美食推荐", icon: UtensilsCrossed },
  { label: "活动咨询", icon: CalendarDays },
  { label: "票务咨询", icon: Ticket },
  { label: "讲解预约", icon: Headphones },
]

const ROUTE_CARDS: RouteCard[] = [
  {
    id: "r1",
    name: "古城漫步·非遗之旅",
    image:
      "https://images.unsplash.com/photo-1774248382928-e575cbe2f132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    spots: 6,
    duration: "4小时",
    tags: ["6个景点", "4小时"],
  },
  {
    id: "r2",
    name: "纳西文化·深度探索",
    image:
      "https://images.unsplash.com/photo-1769434087375-4108031e7c9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    spots: 5,
    duration: "3小时",
    tags: ["5个景点", "3小时"],
  },
  {
    id: "r3",
    name: "寻味古城·美食地图",
    image:
      "https://images.unsplash.com/photo-1724475439769-d2527cc4b188?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    spots: 8,
    duration: "半天",
    tags: ["8个打卡点", "半天"],
  },
]

const FOOD_MERCHANT_CARDS: MerchantCard[] = [
  {
    id: "m1",
    name: "纳西人家餐厅",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=70",
    tag: "地道纳西菜",
    rating: 4.8,
    distance: "240m",
  },
  {
    id: "m2",
    name: "阿妈意餐厅",
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=600&q=70",
    tag: "纳西风味",
    rating: 4.6,
    distance: "320m",
  },
  {
    id: "m3",
    name: "老四方街",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&q=70",
    tag: "传统小吃",
    rating: 4.7,
    distance: "200m",
  },
]

const TICKET_PRODUCT_CARDS: ProductCard[] = [
  {
    id: "p1",
    name: "木府预约信息",
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=600&q=70",
    price: "¥60",
    tag: "含导览",
  },
  {
    id: "p2",
    name: "万古楼游览信息",
    image: "https://images.unsplash.com/photo-1570222094114-26a031d4b728?auto=format&fit=crop&w=600&q=70",
    price: "¥80",
    tag: "俯瞰古城",
  },
  {
    id: "p3",
    name: "古城维护费指南",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=70",
    price: "¥80",
    tag: "72小时有效",
  },
]

const GUIDE_PRODUCT_CARDS: ProductCard[] = [
  {
    id: "g1",
    name: "纳西文化深度讲解",
    image: "https://images.unsplash.com/photo-1533630794409-1fd8c4bckf9c?auto=format&fit=crop&w=600&q=70",
    price: "¥200/2小时",
    tag: "专业讲解",
  },
  {
    id: "g2",
    name: "古城全景导览",
    image: "https://images.unsplash.com/photo-1580619305218-8423a7ef79b4?auto=format&fit=crop&w=600&q=70",
    price: "¥150/2小时",
    tag: "口碑推荐",
  },
]

/* ─────────────────────────────────────────────
   Mock AI response generator
──────────────────────────────────────────── */
function getMockResponse(input: string): {
  text: string
  cardType?: "route" | "merchant" | "product"
  cards?: (RouteCard | MerchantCard | ProductCard)[]
} {
  const q = input.toLowerCase()

  if (q.includes("线路") || q.includes("路线") || q.includes("行程")) {
    return {
      text: "为您推荐以下精品游览线路，涵盖古城核心景区与非遗体验，可根据您的时间灵活选择：",
      cardType: "route",
      cards: ROUTE_CARDS,
    }
  }

  if (q.includes("美食") || q.includes("吃") || q.includes("餐")) {
    return {
      text: "为您推荐以下美食商家，点击可查看详情：",
      cardType: "merchant",
      cards: FOOD_MERCHANT_CARDS,
    }
  }

  if (q.includes("活动") || q.includes("演出") || q.includes("节庆")) {
    return {
      text:
        "近期古城精彩活动一览：\n\n" +
        "📅 **4月23日** — 三多节纳西族传统节庆，四方街广场有民俗表演，免费观看\n" +
        "📅 **每周五-日** — 东巴文化体验营，万古楼脚下，需提前预约\n" +
        "📅 **长期展览** — 丽江木府文物特展，展期至6月底\n" +
        "📅 **每晚8:00** — 束河古镇篝火晚会，具体预约方式以现场公告为准\n\n" +
        "如需购买票券，请进入商城入口查看。",
    }
  }

  if (q.includes("票") || q.includes("门票") || q.includes("价格") || q.includes("多少钱")) {
    return {
      text: "为您整理以下票务和游览信息，购买与核销请进入商城入口查看：",
      cardType: "product",
      cards: TICKET_PRODUCT_CARDS,
    }
  }

  if (q.includes("讲解") || q.includes("导游") || q.includes("预约") || q.includes("导览")) {
    return {
      text: "为您推荐以下讲解服务：",
      cardType: "product",
      cards: GUIDE_PRODUCT_CARDS,
    }
  }

  if (q.includes("住") || q.includes("民宿") || q.includes("酒店")) {
    return {
      text:
        "古城内住宿分布：\n\n" +
        "🏡 **古城核心区** — 传统纳西风格院落民宿，人均¥300-800，夜晚有灯光秀，强烈推荐\n" +
        "🏨 **束河古镇** — 相对安静，价格稍低，适合深度旅行者\n" +
        "🏩 **新城区** — 连锁酒店为主，交通便利，价格¥200起\n\n" +
        "⚠️ 节假日期间建议提前2周以上预订，避免无房可住。",
    }
  }

  return {
    text:
      "感谢您的提问！作为丽江古城旅游助手，我可以帮您：\n\n" +
      "• 🗺 推荐适合您的游览线路\n" +
      "• 🍜 介绍当地特色美食\n" +
      "• 🎫 查询景点票价信息\n" +
      "• 📅 了解近期活动安排\n" +
      "• 🎙 预约专业讲解服务\n\n" +
      "请告诉我您具体想了解什么，我来为您详细解答！",
  }
}

/* ─────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────── */
function AIAvatar({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative rounded-full overflow-hidden flex-shrink-0 shadow-[0_2px_8px_rgba(37,99,235,0.18)] ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={aiAvatar} alt="AI" className="w-full h-full object-cover" />
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <AIAvatar size={32} />
      <div className="bg-white rounded-[18px] rounded-bl-[5px] px-4 py-3 shadow-[0_2px_12px_rgba(45,99,192,0.08)] border border-[#DBE5F3]">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary opacity-60 animate-[pulse-soft_1.2s_ease-in-out_infinite]"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function RouteCardItem({ card }: { card: RouteCard }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/c/routes/${card.id}`)}
      className="bg-white rounded-[14px] overflow-hidden shadow-[0_2px_10px_rgba(45,99,192,0.07)] mb-2.5 last:mb-0 active:scale-[0.98] transition-transform border border-[#DBE5F3]"
    >
      <div className="h-[120px] w-full overflow-hidden">
        <ImageWithFallback src={card.image} alt={card.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="text-[14px] text-text-body mb-2 font-medium">{card.name}</div>
        <div className="flex gap-1.5 mb-2.5">
          <div className="flex items-center gap-1 bg-[#EFF6FF] rounded-full px-2 py-0.5">
            <MapPin size={10} className="text-primary" />
            <span className="text-[11px] text-[#1E40AF]">{card.spots}个景点</span>
          </div>
          <div className="flex items-center gap-1 bg-[#EFF6FF] rounded-full px-2 py-0.5">
            <Clock size={10} className="text-primary" />
            <span className="text-[11px] text-[#1E40AF]">{card.duration}</span>
          </div>
        </div>
        <button className="text-primary text-[12px] font-medium flex items-center gap-0.5">
          查看详情 <span className="text-[10px]">→</span>
        </button>
      </div>
    </div>
  )
}

function MerchantCardItem({ card }: { card: MerchantCard }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/c/merchant/${card.id}`)}
      className="bg-white rounded-[14px] overflow-hidden shadow-[0_2px_10px_rgba(45,99,192,0.07)] mb-2.5 last:mb-0 active:scale-[0.98] transition-transform border border-[#DBE5F3]"
    >
      <div className="h-[100px] w-full overflow-hidden">
        <ImageWithFallback src={card.image} alt={card.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="text-[14px] text-text-body mb-1.5 font-medium">{card.name}</div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1 bg-[#FFF9E6] rounded-full px-2 py-0.5">
            <Star size={10} className="text-[#F59E0B] fill-current" />
            <span className="text-[11px] text-text-body font-medium">{card.rating}</span>
          </div>
          <div className="flex items-center gap-1 bg-[#EFF6FF] rounded-full px-2 py-0.5">
            <MapPin size={10} className="text-primary" />
            <span className="text-[11px] text-[#1E40AF]">{card.distance}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#7A93AE] bg-[#F5F7FA] px-2 py-0.5 rounded-full">{card.tag}</span>
        </div>
      </div>
    </div>
  )
}

function ProductCardItem({ card }: { card: ProductCard }) {
  return (
    <div
      onClick={() => window.open(CRMEB_C_URL, "_blank")}
      className="bg-white rounded-[14px] overflow-hidden shadow-[0_2px_10px_rgba(45,99,192,0.07)] mb-2.5 last:mb-0 active:scale-[0.98] transition-transform border border-[#DBE5F3]"
    >
      <div className="h-[100px] w-full overflow-hidden">
        <ImageWithFallback src={card.image} alt={card.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <div className="text-[14px] text-text-body mb-1.5 font-medium">{card.name}</div>
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-primary font-semibold">{card.price}</span>
          <span className="text-[11px] text-[#7A93AE] bg-[#F5F7FA] px-2 py-0.5 rounded-full ml-auto">{card.tag}</span>
        </div>
      </div>
    </div>
  )
}

function AIBubble({ message }: { message: Message }) {
  const renderText = (text: string) => {
    return text.split("\n").map((line, li) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={li}>
          {parts.map((p, pi) =>
            pi % 2 === 1 ? (
              <strong key={pi} className="font-semibold text-text-body">
                {p}
              </strong>
            ) : (
              <span key={pi}>{p}</span>
            )
          )}
          {li < text.split("\n").length - 1 && <br />}
        </span>
      )
    })
  }

  const showCursor = !message.isThinking && message.displayText.length < message.text.length

  return (
    <div className="flex items-end gap-2 mb-3">
      <AIAvatar size={32} />

      <div className="flex-1 max-w-[280px]">
        <div className="bg-white rounded-[18px] rounded-bl-[5px] px-3.5 py-[11px] shadow-[0_2px_12px_rgba(45,99,192,0.08)] border border-[#DBE5F3]">
          <div className="text-[14px] text-text-body leading-[1.6]">
            {renderText(message.displayText)}
            {showCursor && (
              <span className="inline-block w-[2px] h-[14px] bg-primary ml-0.5 animate-pulse align-text-bottom" />
            )}
          </div>
        </div>

        {message.cards && message.displayText === message.text && (
          <div className="mt-2">
            {message.cardType === "route" &&
              (message.cards as RouteCard[]).map((c) => <RouteCardItem key={c.id} card={c} />)}
            {message.cardType === "merchant" &&
              (message.cards as MerchantCard[]).map((c) => <MerchantCardItem key={c.id} card={c} />)}
            {message.cardType === "product" &&
              (message.cards as ProductCard[]).map((c) => <ProductCardItem key={c.id} card={c} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[280px] bg-gradient-to-br from-[#2563EB] to-[#3B82F6] text-white rounded-[18px] rounded-br-[5px] px-3.5 py-[11px] shadow-[0_3px_12px_rgba(37,99,235,0.22)] text-[14px] leading-[1.6]">
        {message.text}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Welcome card (shown when only welcome msg)
──────────────────────────────────────────── */
function WelcomeCard({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div className="mb-4">
      {/* Greeting bubble */}
      <div className="flex items-end gap-2 mb-3">
        <AIAvatar size={32} />
        <div className="flex-1 max-w-[300px]">
          <div className="bg-white rounded-[18px] rounded-bl-[5px] px-4 py-3 shadow-[0_2px_12px_rgba(45,99,192,0.08)] border border-[#DBE5F3]">
            <div className="text-[14px] text-text-body leading-[1.6]">
              您好！我是您的<strong className="font-semibold">丽江古城旅游助手</strong> 🎋
              <br />
              无论是游线路、美食、票务还是讲解，都可以问我～
            </div>
          </div>
        </div>
      </div>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 gap-2.5 pl-[42px]">
        {QUICK_SUGGESTIONS.map((s) => {
          const Icon = s.icon
          return (
            <button
              key={s.label}
              onClick={() => onPick(s.label)}
              className="flex items-center gap-2.5 bg-white rounded-[14px] px-3 py-2.5 border border-[#DBE5F3] shadow-[0_2px_8px_rgba(45,99,192,0.06)] active:scale-[0.97] transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#3B82F6] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon size={16} className="text-white" />
              </div>
              <span className="text-[13px] text-text-body font-medium">{s.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Confirm dialog
──────────────────────────────────────────── */
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[280px] shadow-xl">
        <div className="text-[15px] text-text-body text-center mb-5 leading-relaxed">{message}</div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-[40px] rounded-full border border-[#E0E0E0] text-text-secondary text-[14px]"
          >
            取消
          </button>
          <button onClick={onConfirm} className="flex-1 h-[40px] rounded-full bg-primary text-white text-[14px]">
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main Page
──────────────────────────────────────────── */
let _msgCounter = 0
function newId() {
  return `msg_${++_msgCounter}_${Date.now()}`
}

const WELCOME_MSG: Message = {
  id: "welcome",
  role: "ai",
  text: "您好！我是您的丽江古城旅游助手，请问有什么可以帮您？",
  displayText: "您好！我是您的丽江古城旅游助手，请问有什么可以帮您？",
  isThinking: false,
}

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MSG])
  const [input, setInput] = useState("")
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      })
    }, 50)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const pending = messages.find((m) => m.role === "ai" && !m.isThinking && m.displayText.length < m.text.length)

    if (!pending) {
      if (typingTimerRef.current) {
        clearInterval(typingTimerRef.current)
        typingTimerRef.current = null
      }
      return
    }

    if (typingTimerRef.current) clearInterval(typingTimerRef.current)

    typingTimerRef.current = setInterval(() => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === pending.id)
        if (idx === -1) return prev
        const msg = prev[idx]
        if (msg.displayText.length >= msg.text.length) {
          clearInterval(typingTimerRef.current!)
          typingTimerRef.current = null
          return prev
        }
        const nextLen = Math.min(msg.displayText.length + 2, msg.text.length)
        const updated = { ...msg, displayText: msg.text.slice(0, nextLen) }
        const next = [...prev]
        next[idx] = updated
        return next
      })
    }, 28)

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.map((m) => m.id + m.isThinking).join(",")])

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setInput("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "36px"
    }

    const userMsg: Message = {
      id: newId(),
      role: "user",
      text: trimmed,
      displayText: trimmed,
      isThinking: false,
    }

    const aiId = newId()
    const thinkingMsg: Message = {
      id: aiId,
      role: "ai",
      text: "",
      displayText: "",
      isThinking: true,
    }

    setMessages((prev) => [...prev, userMsg, thinkingMsg])

    setTimeout(
      () => {
        const { text: aiText, cards, cardType } = getMockResponse(trimmed)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId
              ? {
                  ...m,
                  text: aiText,
                  displayText: "",
                  cards,
                  cardType,
                  isThinking: false,
                }
              : m
          )
        )
      },
      1200 + Math.random() * 600
    )
  }, [])

  const handleSuggestion = (s: string) => {
    sendMessage(s)
  }

  const handleSend = () => {
    if (input.trim()) sendMessage(input)
  }

  const clearSession = () => {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current)
      typingTimerRef.current = null
    }
    setMessages([{ ...WELCOME_MSG, id: "welcome_" + Date.now() }])
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = "36px"
    el.style.height = Math.min(el.scrollHeight, 96) + "px"
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = input.trim().length > 0
  const isWelcomeState = messages.length === 1 && messages[0].id.startsWith("welcome")

  return (
    <div
      className="fixed inset-x-0 top-0 z-20 flex flex-col"
      style={{
        bottom: "60px",
        background: "linear-gradient(180deg, #6C93D4 0%, #A5BEE8 8%, #E5EFFE 16%, #F0F6FF 30%, #F5F9FF 100%)",
      }}
    >
      {/* Top Bar */}
      <div className="relative flex-shrink-0 z-10">
        <div
          className="flex items-center h-[52px] px-4"
          style={{
            background: "linear-gradient(180deg, #2D63C0 0%, #3D6FC5 40%, #4A78C8 70%, #6C93D4 100%)",
          }}
        >
          <div className="flex-1" />
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-tight">
            <h1 className="text-[16px] text-white font-semibold tracking-tight">AI 旅游助手</h1>
            <span className="text-[10px] text-white/75 flex items-center gap-1 mt-0.5">
              <span className="w-1 h-1 rounded-full bg-[#7EEFC7]" />
              在线为您服务
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors active:scale-90"
            >
              <Trash2 size={17} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-2" style={{ overscrollBehavior: "contain" }}>
        {isWelcomeState ? (
          <WelcomeCard onPick={handleSuggestion} />
        ) : (
          messages.map((msg) => {
            if (msg.role === "user") {
              return <UserBubble key={msg.id} message={msg} />
            }
            if (msg.isThinking) {
              return <ThinkingBubble key={msg.id} />
            }
            return <AIBubble key={msg.id} message={msg} />
          })
        )}
        <div className="h-4" />
      </div>

      {/* Quick Suggestions (only when not in welcome state) */}
      {!isWelcomeState && (
        <div className="px-4 pt-1 pb-0 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
            {QUICK_SUGGESTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.label}
                  onClick={() => handleSuggestion(s.label)}
                  className="flex-shrink-0 flex items-center gap-1.5 pl-2.5 pr-3.5 py-1.5 rounded-full bg-white border border-[#DBE5F3] text-[13px] text-[#1E40AF] active:bg-[#EFF6FF] transition-colors shadow-[0_1px_4px_rgba(45,99,192,0.05)]"
                >
                  <Icon size={13} className="text-primary" />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Bottom Input Bar */}
      <div className="flex-shrink-0 bg-white border-t border-[#DBE5F3] px-3 py-2 flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="向 AI 助手提问..."
          rows={1}
          className="flex-1 bg-[#F5F7FA] rounded-[20px] px-4 py-2 text-[14px] text-text-body placeholder-[#BDBDBD] resize-none outline-none leading-[20px] focus:bg-white focus:ring-2 focus:ring-primary/30 transition-all"
          style={{ minHeight: "36px", maxHeight: "96px" }}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
          style={{
            background: canSend ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "#E8EDF3",
            boxShadow: canSend ? "0 3px 10px rgba(37,99,235,0.3)" : "none",
          }}
        >
          <Send size={17} className={canSend ? "text-white" : "text-[#BDBDBD]"} />
        </button>
      </div>

      {/* Safe area padding */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white flex-shrink-0" />

      {/* Clear Confirm Dialog */}
      {showClearConfirm && (
        <ConfirmDialog
          message="确认清空当前会话记录？清空后无法恢复。"
          onConfirm={() => {
            setShowClearConfirm(false)
            clearSession()
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  )
}
