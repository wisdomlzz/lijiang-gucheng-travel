import { Component, type ReactNode, type ErrorInfo } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-[14px] text-text-body font-medium">页面加载失败</p>
          <p className="text-[12px] text-text-tertiary text-center max-w-[260px]">
            {this.state.error?.message ?? "未知错误"}
          </p>
          <button
            onClick={this.handleRetry}
            className="h-10 px-6 rounded-xl bg-primary text-white text-[13px] font-medium active:scale-[0.98] transition-transform"
          >
            点击重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
