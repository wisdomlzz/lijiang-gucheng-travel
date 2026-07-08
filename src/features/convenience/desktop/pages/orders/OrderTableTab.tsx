import { Card } from "@/shared/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { StatusBadge } from "@/shared/components/ui/status-badge"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  Eye,
  Ban,
  Image as ImageIcon,
  Undo2,
} from "lucide-react"
import type { ConvenienceOrder } from "@/shared/types"
import { type TabKey } from "./tab-config"

interface OrderTableTabProps {
  activeTab: TabKey
  paginatedItems: ConvenienceOrder[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  filteredOrders: ConvenienceOrder[]
  searchQuery: string
  onViewDetail: (orderId: string) => void
  onManualDispatch: (orderId: string) => void
  onAutoRetry: (orderId: string) => void
  onForceCancelDialog: (orderId: string) => void
  onResolvePendingReview: (orderId: string, status: string) => void
  onForceCancel: (orderId: string) => void
  onApproveCancel: (orderId: string) => void
  onRejectCancelDialog: (orderId: string) => void
  onApprovePrice: (orderId: string) => void
  onRejectPrice: (orderId: string) => void
  onApprovePayment: (orderId: string) => void
  onRejectPayment: (orderId: string) => void
  onRestoreQuote: (orderId: string) => void
}

export function OrderTableTab({
  activeTab,
  paginatedItems,
  currentPage,
  totalPages,
  onPageChange,
  total,
  filteredOrders,
  searchQuery,
  onViewDetail,
  onManualDispatch,
  onAutoRetry,
  onForceCancelDialog,
  onResolvePendingReview,
  onForceCancel,
  onApproveCancel,
  onRejectCancelDialog,
  onApprovePrice,
  onRejectPrice,
  onApprovePayment,
  onRejectPayment,
  onRestoreQuote,
}: OrderTableTabProps) {
  return (
    <>
      {/* ===== Tab 1: 全部订单 ===== */}
      {activeTab === "all" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} kind="order" />
                  </TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell>{o.priceQuote ? `¥${o.priceQuote}` : "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {o.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onViewDetail(o.id)}
                        title="详情"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      {(o.status === "S10" || o.status === "A10" || o.status === "S90") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => onManualDispatch(o.id)}
                          >
                            派单
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onAutoRetry(o.id)}
                            title="重试"
                          >
                            <RefreshCw className="size-3.5" />
                          </Button>
                        </>
                      )}
                      {o.status !== "S40" && o.status !== "S50" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-rose-600"
                          onClick={() => onForceCancelDialog(o.id)}
                          title="强制取消"
                        >
                          <Ban className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    {searchQuery.trim() ? "无匹配订单" : "暂无订单"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 2: 待审核 ===== */}
      {activeTab === "pending-review" && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="size-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">
              以下订单需要管理员审核处理
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead>原因</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} kind="order" />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.status === "S90"
                      ? "需人工干预"
                      : o.status === "S10"
                        ? "待派单"
                        : "待处理"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => onResolvePendingReview(o.id, o.status)}
                      >
                        <CheckCircle2 className="size-3 mr-1" /> 通过
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => onForceCancel(o.id)}
                      >
                        <XCircle className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" />{" "}
                    暂无待审核订单
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 3: 取消审批 ===== */}
      {activeTab === "cancel-approval" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>当前状态</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{o.address}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} kind="order" />
                  </TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => onApproveCancel(o.id)}
                      >
                        <CheckCircle2 className="size-3 mr-1" /> 同意
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => onRejectCancelDialog(o.id)}
                      >
                        <XCircle className="size-3 mr-1" /> 拒绝
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" />{" "}
                    暂无取消申请
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 4: 报价审核 ===== */}
      {activeTab === "price-review" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>报价</TableHead>
                <TableHead>参考价</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{o.address}</TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="font-medium">
                    <span className="text-blue-600">
                      ¥{o.priceQuote ?? "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.refPrice ? `¥${o.refPrice}` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => onApprovePrice(o.id)}
                      >
                        <CheckCircle2 className="size-3 mr-1" /> 通过
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => onRejectPrice(o.id)}
                      >
                        <Ban className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" />{" "}
                    暂无待审核报价
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 5: 付款凭证 ===== */}
      {activeTab === "payment-proof" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>凭证</TableHead>
                <TableHead>上传时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{o.address}</TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell className="font-medium">
                    ¥{o.priceQuote ?? "-"}
                  </TableCell>
                  <TableCell>
                    {o.paymentProof ? (
                      <a
                        href={o.paymentProof}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ImageIcon className="size-5 text-blue-500 cursor-pointer hover:text-blue-700" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {o.completedAt || o.createdAt}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => onApprovePayment(o.id)}
                      >
                        <CheckCircle2 className="size-3 mr-1" /> 确认
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => onRejectPayment(o.id)}
                      >
                        <XCircle className="size-3 mr-1" /> 驳回
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-8"
                  >
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" />{" "}
                    暂无待审核付款凭证
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}

      {/* ===== Tab 6: 人工处理 ===== */}
      {activeTab === "manual" && (
        <Card className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>服务类型</TableHead>
                <TableHead>异常原因</TableHead>
                <TableHead>进入前状态</TableHead>
                <TableHead>服务人员</TableHead>
                <TableHead>金额</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.serviceType}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {o.manualReason === "dispatch_failed"
                        ? "派单失败"
                        : o.manualReason === "quote_rejected"
                          ? "报价争议"
                          : o.manualReason === "pay_timeout"
                            ? "支付超时"
                            : o.manualReason || "未知"}
                    </Badge>
                  </TableCell>
                  <TableCell>{o.beforeManualStatus || "-"}</TableCell>
                  <TableCell>{o.staffName || "-"}</TableCell>
                  <TableCell>{o.priceQuote ? `¥${o.priceQuote}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 border-emerald-200"
                        onClick={() => onAutoRetry(o.id)}
                      >
                        <RefreshCw className="size-3 mr-1" /> 重试
                      </Button>
                      {o.manualReason === "quote_rejected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-blue-600 border-blue-200"
                          onClick={() => onRestoreQuote(o.id)}
                        >
                          <Undo2 className="size-3 mr-1" /> 恢复
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs text-red-600 border-red-200"
                        onClick={() => onForceCancelDialog(o.id)}
                      >
                        <Ban className="size-3 mr-1" /> 强制取消
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    <CheckCircle2 className="size-5 text-emerald-500 inline mr-1" />{" "}
                    暂无人工处理订单
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-3 border-t pt-3">
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              pageSize={10}
              onPageSizeChange={() => {}}
              total={total}
            />
          </div>
        </Card>
      )}
    </>
  )
}