/**
 * 异步路由处理器包装器
 * 自动捕获 promise rejections 并传递给 next(err)
 * 新路由使用: router.get("/path", asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

/**
 * 全局错误处理中间件
 * 注册到 Express 应用的路由链末尾
 * 用法: app.use(errorHandler)
 */
export function errorHandler(err, req, res, _next) {
  console.error("[ERROR]", err)

  const statusCode = err.status || err.statusCode || 500
  const message = err.message || "Internal Server Error"

  // 区分客户端错误和服务端错误
  if (statusCode >= 500) {
    console.error(err.stack)
  }

  res.status(statusCode).json({
    ok: false,
    msg: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  })
}

/**
 * 自定义业务错误类
 * 用法: throw new AppError("积分余额不足", 400)
 */
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.name = "AppError"
    this.status = status
  }
}
