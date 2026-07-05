import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/components/ui/sheet"
import { Button } from "@/shared/components/ui/button"
import { Phone, Copy, X, Star } from "lucide-react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  name: string
  phone: string
  avatar?: string
  subtitle?: string
  rating?: number
  orderCount?: number
}

export function ContactSheet({ open, onOpenChange, title, name, phone, avatar, subtitle, rating, orderCount }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex items-center gap-3 mb-4">
          {avatar ? (
            <img src={avatar} alt={name} className="size-12 rounded-full object-cover" />
          ) : (
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-medium">{name}</div>
            {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
            {rating && (
              <div className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
                <Star className="size-3 fill-current" />
                {rating}
                {orderCount && <span className="text-muted-foreground ml-1">{orderCount}单</span>}
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl justify-start gap-2"
            onClick={() => {
              navigator.clipboard.writeText(phone)
              toast.success("已复制电话")
            }}
          >
            <Copy className="size-4" />
            复制电话 <span className="font-mono ml-auto">{phone}</span>
          </Button>
          <Button className="w-full h-11 rounded-xl gap-2" onClick={() => toast.success(`正在呼叫 ${phone}`)}>
            <Phone className="size-4" />
            拨打电话
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
