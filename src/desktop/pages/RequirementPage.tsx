import { useEffect, useState, useCallback, useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { BookOpen, ExternalLink, ChevronRight, Download, FileText } from "lucide-react"

interface Heading {
  level: number
  text: string
  id: string
}

interface DocItem {
  name: string
  path: string
  label: string
  version: string
}

const DOC_LIST: DocItem[] = [
  { name: "便民服务 MVP 需求", path: "/docs/requirements/convenience-service-mvp-requirements.md", label: "便民服务平台 MVP 1.0 产品设计文档", version: "v1.2 · 2026-07-07" },
  { name: "便民服务 MVP 设计", path: "/docs/requirements/convenience-service-mvp-design.md", label: "便民服务 MVP 改造设计方案", version: "v1.0 · 2026-07-07" },
  { name: "内容管理", path: "/docs/requirements/content-requirements.md", label: "内容管理模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "投诉管理", path: "/docs/requirements/complaints-requirements.md", label: "投诉管理模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "诚信评分", path: "/docs/requirements/trust-score-requirements.md", label: "诚信评分配置模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "商户审核", path: "/docs/requirements/merchant-review-requirements.md", label: "商户审核模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "院落预约", path: "/docs/requirements/bookings-requirements.md", label: "院落预约模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "志愿服务", path: "/docs/requirements/volunteer-requirements.md", label: "志愿服务模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "签到打卡", path: "/docs/requirements/checkin-requirements.md", label: "签到打卡模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "供应商管理", path: "/docs/requirements/supplier-requirements.md", label: "供应商管理模块产品需求文档", version: "v1.0 · 2026-07-07" },
  { name: "综合系统", path: "/docs/requirement.md", label: "综合系统需求说明书", version: "V2.2 · 2026-05-28" },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

function extractHeadings(markdown: string): Heading[] {
  const lines = markdown.split("\n")
  const headings: Heading[] = []
  for (const line of lines) {
    const m = line.match(/^(#{1,4})\s+(.+)/)
    if (m) {
      const text = m[2].replace(/`/g, "").trim()
      headings.push({ level: m[1].length, text, id: slugify(text) })
    }
  }
  return headings
}

type GroupedHeadings = { label: string; children: Heading[] }[]

function groupHeadings(headings: Heading[]): GroupedHeadings {
  const groups: GroupedHeadings = []
  let current: Heading[] = []
  for (const h of headings) {
    if (h.level <= 2) {
      if (current.length > 0) {
        groups.push({ label: "", children: current })
        current = []
      }
      groups.push({ label: h.text, children: [] })
    } else {
      current.push(h)
    }
  }
  if (current.length > 0) groups.push({ label: "", children: current })
  return groups
}

const HEADER_H = 56

export function RequirementPage() {
  const [content, setContent] = useState<string>("")
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [currentDoc, setCurrentDoc] = useState<DocItem>(DOC_LIST[0])

  const groups = useMemo(() => groupHeadings(headings), [headings])

  useEffect(() => {
    fetch(currentDoc.path)
      .then((r) => r.text())
      .then((text) => {
        setContent(text)
        setHeadings(extractHeadings(text))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [currentDoc])

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    setActiveId(id)
  }, [])

  useEffect(() => {
    if (headings.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: `-${HEADER_H + 16}px 0px -70% 0px` }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  const toggleGroup = useCallback((label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="size-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200/80 flex items-center px-6 backdrop-blur-sm bg-white/90"
        style={{ height: HEADER_H }}
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BookOpen className="size-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800 leading-tight">{currentDoc.label}</h1>
            <p className="text-[10px] text-slate-400 leading-tight">{currentDoc.version} · 丽江古城游综合系统</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <a
            href={currentDoc.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors shrink-0"
          >
            <ExternalLink className="size-3.5" />
            源文件
          </a>
          <a
            href={currentDoc.path}
            download={currentDoc.label + ".md"}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors shrink-0"
          >
            <Download className="size-3.5" />
            下载
          </a>
        </div>
      </header>

      <aside
        className="fixed left-0 bg-slate-50/50 border-r border-slate-200/60 overflow-y-auto hidden lg:flex lg:flex-col"
        style={{ top: HEADER_H, bottom: 0, width: 240 }}
      >
        {/* 文档切换 */}
        <div className="p-4 pb-2 border-b border-slate-200/50">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2 px-2">文档</p>
          <nav className="space-y-0.5">
            {DOC_LIST.map((doc) => (
              <button
                key={doc.name}
                onClick={() => {
                  setCurrentDoc(doc)
                  setLoading(true)
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-all ${
                  currentDoc.name === doc.name
                    ? "bg-blue-50 text-blue-600 font-medium"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                }`}
              >
                <FileText className="size-3.5 shrink-0" />
                <span className="truncate">{doc.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 目录 */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-4 px-2">目录</p>
          <nav className="space-y-3">
            {groups.map((group) => {
              const hasChildren = group.children.length > 0
              const isCollapsed = collapsed.has(group.label)
              const isGroupActive = group.label && headings.find((h) => h.text === group.label)?.id === activeId
              const isChildActive = group.children.some((c) => c.id === activeId)
              const isExpanded = !isCollapsed || isChildActive

              return (
                <div key={group.label || group.children[0]?.id || Math.random()}>
                  {group.label && (
                    <button
                      onClick={() => {
                        const id = headings.find((h) => h.text === group.label)?.id
                        if (id) scrollTo(id)
                        if (hasChildren) toggleGroup(group.label)
                      }}
                      className={`flex items-center gap-1 w-full text-left px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        isGroupActive
                          ? "text-blue-600 bg-blue-50"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      }`}
                    >
                      {hasChildren && (
                        <ChevronRight className={`size-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      )}
                      <span className={isGroupActive ? "" : ""}>{group.label}</span>
                    </button>
                  )}
                  {hasChildren && isExpanded && (
                    <div className={`mt-1 space-y-px ${group.label ? "" : ""}`}>
                      {group.children.map((h) => (
                        <button
                          key={h.id}
                          onClick={() => scrollTo(h.id)}
                          className={`block w-full text-left py-1.5 px-3 text-xs rounded-md transition-all border-l-2 ${
                            activeId === h.id
                              ? "text-blue-600 bg-blue-50/80 font-medium border-l-blue-500"
                              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 border-l-transparent"
                          } ${h.level === 3 ? "ml-2" : "ml-4"}`}
                          title={h.text}
                        >
                          {h.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      <main className="lg:ml-60" style={{ paddingTop: HEADER_H }}>
        <div className="max-w-2xl mx-auto px-5 py-12 lg:py-16">
          <div className="prose-custom">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => {
                  const text = String(children)
                  const id = slugify(text)
                  return (
                    <div className="mb-12">
                      <h1
                        id={id}
                        className="text-3xl font-bold text-slate-900 tracking-tight scroll-mt-20 leading-tight"
                      >
                        {children}
                      </h1>
                      <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-blue-400 to-blue-600" />
                    </div>
                  )
                },
                h2: ({ children }) => {
                  const text = String(children)
                  const id = slugify(text)
                  return (
                    <h2 id={id} className="text-lg font-semibold text-slate-800 mt-14 mb-5 scroll-mt-20 leading-snug">
                      {children}
                    </h2>
                  )
                },
                h3: ({ children }) => {
                  const text = String(children)
                  const id = slugify(text)
                  return (
                    <h3 id={id} className="text-sm font-semibold text-slate-700 mt-10 mb-4 scroll-mt-20 leading-snug">
                      {children}
                    </h3>
                  )
                },
                h4: ({ children }) => {
                  const text = String(children)
                  const id = slugify(text)
                  return (
                    <div className="mt-10 mb-5">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="w-1 h-5 rounded-full bg-blue-500 shrink-0" />
                        <h4 id={id} className="text-sm font-semibold text-slate-800 scroll-mt-20 leading-snug">
                          {children}
                        </h4>
                      </div>
                      <div className="h-px bg-gradient-to-r from-slate-200 via-slate-100 to-transparent" />
                    </div>
                  )
                },
                p: ({ children }) => {
                  const text = typeof children === "string" ? children : ""
                  const isMeta = text.startsWith("**版本**")
                  return (
                    <p className={`text-sm leading-7 mb-4 ${isMeta ? "text-slate-500" : "text-slate-600"}`}>
                      {children}
                    </p>
                  )
                },
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 space-y-1 mb-5 text-sm text-slate-600">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 space-y-1.5 mb-5 text-sm text-slate-600">{children}</ol>
                ),
                li: ({ children }) => <li className="leading-6 pl-1">{children}</li>,
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-6 rounded-xl border border-slate-200/70 bg-white shadow-sm">
                    <table className="w-full text-sm">{children}</table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-slate-50/80 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => <tbody>{children}</tbody>,
                tr: ({ children }) => (
                  <tr className="border-b border-slate-100 last:border-0 transition-colors [&:hover]:bg-slate-50">
                    {children}
                  </tr>
                ),
                th: ({ children }) => <th className="px-4 py-3 text-left font-medium text-slate-500">{children}</th>,
                td: ({ children }) => <td className="px-4 py-3 text-slate-600">{children}</td>,
                blockquote: ({ children }) => {
                  const childArray = Array.isArray(children) ? children : [children]
                  const firstChild = childArray[0]
                  const firstText = typeof firstChild === "string" ? firstChild : String(firstChild || "")

                  return (
                    <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 size-2 rounded-full bg-blue-400 shrink-0" />
                        <div className="text-sm text-slate-600 leading-7 [&>p]:mb-0">{children}</div>
                      </div>
                    </div>
                  )
                },
                code: ({ children }) => (
                  <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded-md font-mono text-blue-600 border border-slate-200/50">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-slate-900 text-slate-100 rounded-xl p-5 overflow-x-auto mb-6 text-xs leading-6 shadow-md border border-slate-800">
                    {children}
                  </pre>
                ),
                hr: () => (
                  <div className="my-10 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <div className="size-1.5 rounded-full bg-slate-300" />
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  </div>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline underline-offset-2 decoration-blue-300 hover:decoration-blue-600 transition-all"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => {
                  const text = String(children)
                  const isSubHead = /^(功能说明|业务流程|交互与规则|页面元素|表单字段|功能概述|功能说明)$/.test(text)
                  if (isSubHead) {
                    return (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60">
                        <span className="size-1.5 rounded-full bg-slate-400" />
                        {children}
                      </span>
                    )
                  }
                  return <strong className="font-semibold text-slate-700">{children}</strong>
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          <div className="mt-16 pt-6 border-t border-slate-200/60">
            <p className="text-xs text-slate-400 text-center">
              丽江古城游综合系统 · {currentDoc.version} {currentDoc.label}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
