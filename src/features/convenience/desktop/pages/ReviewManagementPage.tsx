import { useMemo, useState } from "react"
import { Card, CardContent } from "../../../../shared/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../shared/components/ui/table"
import { Badge } from "../../../../shared/components/ui/badge"
import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import { Textarea } from "../../../../shared/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../../../shared/components/ui/dialog"
import { PageLayout } from "../../../../desktop/components/common/PageLayout"
import { useReviewStore } from "../../store"
import { usePagination } from "@/shared/hooks/usePagination"
import { PaginationBar } from "@/shared/components/ui/data-toolbar"
import { Star, MessageSquare, TrendingUp, AlertTriangle, Search, ThumbsUp } from "lucide-react"
import { toast } from "sonner"
import { ALL_CONVENIENCE_TYPES } from "../../../../shared/types"

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  )
}

export default function ReviewManagementPage() {
  const reviews = useReviewStore((s) => s.reviews)
  const getStats = useReviewStore((s) => s.getStats)
  const getFiltered = useReviewStore((s) => s.getFiltered)
  const getReview = useReviewStore((s) => s.getReview)
  const replyReview = useReviewStore((s) => s.replyReview)
  const markFollowUp = useReviewStore((s) => s.markFollowUp)

  const [searchQuery, setSearchQuery] = useState("")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [replyFilter, setReplyFilter] = useState<string>("all")
  const [serviceFilter, setServiceFilter] = useState<string>("all")
  const [replyDialogId, setReplyDialogId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [detailDialogId, setDetailDialogId] = useState<string | null>(null)

  const stats = useMemo(() => getStats(), [reviews, getStats])

  const filtered = useMemo(() => {
    let list = getFiltered({
      replyStatus: replyFilter === "all" ? undefined : (replyFilter as "replied" | "unreplied"),
      serviceType: serviceFilter === "all" ? undefined : serviceFilter,
    })
    if (ratingFilter === "positive") list = list.filter((r) => r.rating >= 4)
    else if (ratingFilter === "negative") list = list.filter((r) => r.rating <= 2)
    else if (ratingFilter === "medium") list = list.filter((r) => r.rating === 3)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.staffName.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q) ||
          r.content.toLowerCase().includes(q)
      )
    }
    return list
  }, [reviews, getFiltered, ratingFilter, replyFilter, serviceFilter, searchQuery])

  const pagination = usePagination(filtered, 10)
  const reviewDetail = detailDialogId ? getReview(detailDialogId) : null

  const handleReply = () => {
    if (!replyDialogId || !replyContent.trim()) {
      toast.error("请输入回复内容")
      return
    }
    replyReview(replyDialogId, replyContent.trim())
    setReplyDialogId(null)
    setReplyContent("")
    toast.success("回复已提交")
  }

  return (
    <PageLayout title="评价管理" description="查看和管理用户对便民服务的评价">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">总评价数</span>
            </div>
            <div className="text-2xl font-semibold mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ThumbsUp className="size-5 text-emerald-500" />
              <span className="text-sm text-muted-foreground">好评率</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-emerald-600">{stats.positiveRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-5 text-amber-500" />
              <span className="text-sm text-muted-foreground">待回复</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-amber-600">{stats.pendingReply}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              <span className="text-sm text-muted-foreground">差评数</span>
            </div>
            <div className="text-2xl font-semibold mt-1 text-red-600">{stats.negativeCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、订单号、内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="h-9 text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary"
          >
            <option value="all">全部评分</option>
            <option value="positive">好评（4-5星）</option>
            <option value="medium">中评（3星）</option>
            <option value="negative">差评（1-2星）</option>
          </select>
          <select
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value)}
            className="h-9 text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary"
          >
            <option value="all">全部回复状态</option>
            <option value="unreplied">未回复</option>
            <option value="replied">已回复</option>
          </select>
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="h-9 text-sm rounded-lg border border-gray-200 bg-white px-3 text-text-secondary"
          >
            <option value="all">全部服务类型</option>
            {ALL_CONVENIENCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* 评价列表 */}
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>订单号</TableHead>
              <TableHead>服务类型</TableHead>
              <TableHead>服务人员</TableHead>
              <TableHead>用户</TableHead>
              <TableHead>评分</TableHead>
              <TableHead>评价内容</TableHead>
              <TableHead>时间</TableHead>
              <TableHead>回复</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedItems.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="text-xs font-mono">{review.orderId}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {review.serviceType}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{review.staffName}</TableCell>
                <TableCell>{review.userName}</TableCell>
                <TableCell>
                  <StarRating rating={review.rating} />
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate text-sm text-text-secondary">{review.content}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{review.createdAt}</TableCell>
                <TableCell>
                  {review.replyContent ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">已回复</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs text-amber-600 bg-amber-50">
                      未回复
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDetailDialogId(review.id)}>
                      查看
                    </Button>
                    {!review.replyContent && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setReplyDialogId(review.id)
                          setReplyContent("")
                        }}
                      >
                        回复
                      </Button>
                    )}
                    {review.rating <= 2 && (
                      <Button
                        variant={review.followUp ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          markFollowUp(review.id)
                          toast.success(review.followUp ? "已取消跟进标记" : "已标记为需跟进")
                        }}
                      >
                        跟进
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  {searchQuery.trim() ? "无匹配的评价" : "暂无评价数据"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-3 border-t pt-3">
          <PaginationBar
            page={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
            pageSize={10}
            onPageSizeChange={() => {}}
            total={pagination.total}
          />
        </div>
      </Card>

      {/* 回复弹窗 */}
      <Dialog open={replyDialogId !== null} onOpenChange={(open) => !open && setReplyDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>回复评价</DialogTitle>
            <DialogDescription>
              {replyDialogId &&
                `回复给 ${reviews.find((r) => r.id === replyDialogId)?.userName ?? ""}`}
            </DialogDescription>
          </DialogHeader>
          {replyDialogId && (
            <div className="space-y-3">
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-text-secondary">
                "{reviews.find((r) => r.id === replyDialogId)?.content}"
              </div>
              <Textarea
                placeholder="请输入回复内容..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialogId(null)}>
              取消
            </Button>
            <Button onClick={handleReply}>提交回复</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 评价详情弹窗 */}
      <Dialog open={detailDialogId !== null} onOpenChange={(open) => !open && setDetailDialogId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>评价详情</DialogTitle>
          </DialogHeader>
          {reviewDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">订单：</span>
                  <span className="font-mono">{reviewDetail.orderId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">服务类型：</span>
                  <span>{reviewDetail.serviceType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">服务人员：</span>
                  <span>{reviewDetail.staffName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">用户：</span>
                  <span>{reviewDetail.userName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">评分：</span>
                  <StarRating rating={reviewDetail.rating} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">评价内容：</div>
                <div className="p-3 bg-gray-50 rounded-lg text-sm">{reviewDetail.content}</div>
              </div>
              {reviewDetail.images.length > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">图片：</div>
                  <div className="flex gap-2">
                    {reviewDetail.images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`评价图片${i + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
              {reviewDetail.replyContent && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">回复内容：</div>
                  <div className="p-3 bg-blue-50 rounded-lg text-sm">
                    <div className="text-xs text-muted-foreground mb-1">{reviewDetail.repliedAt}</div>
                    {reviewDetail.replyContent}
                  </div>
                </div>
              )}
              {reviewDetail.followUp && (
                <Badge className="bg-red-100 text-red-700">已标记需跟进</Badge>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}