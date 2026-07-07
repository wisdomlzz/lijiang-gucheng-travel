import { useMemo } from "react"
import { useNavigate } from "react-router"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/shared/components/mobile/PageHeader"
import { useAddressStore } from "@/features/address/store/address-store"
import { useAuthStore } from "@/platform/auth"
import { toast } from "sonner"
import { useLoadMore } from "@/shared/hooks/useLoadMore"

export function AddressListPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const userId = currentUser?.id ?? ""
  const allAddresses = useAddressStore((s) => s.addresses)
  const addresses = useMemo(() => allAddresses.filter((a) => a.userId === userId), [allAddresses, userId])
  const { visible, hasMore, loadMore } = useLoadMore(addresses, 6)
  const { setDefault, remove } = useAddressStore.getState()

  return (
    <div className="bg-surface-page min-h-full pb-[80px]">
      <PageHeader title="地址管理" />

      {addresses.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[14px] text-text-tertiary">暂无收货地址</p>
        </div>
      ) : (
        <>
          <div className="p-3 space-y-3">
            {visible.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] text-text-body">{a.name}</span>
                  <span className="text-[13px] text-text-secondary">
                    {a.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                  </span>
                  {a.isDefault && <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] rounded">默认</span>}
                </div>
                <p className="mt-2 text-[13px] text-text-secondary leading-relaxed">
                  {a.province}
                  {a.city}
                  {a.district}
                  {a.detail}
                </p>
                <div className="mt-3 pt-3 border-t border-border-light flex items-center">
                  <button
                    onClick={() => {
                      if (!a.isDefault) {
                        setDefault(a.id)
                        toast.success("已设为默认地址")
                      }
                    }}
                    className="flex items-center gap-1 text-[12px] text-text-secondary"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        a.isDefault ? "border-primary bg-primary" : "border-[#CCC]"
                      }`}
                    >
                      {a.isDefault && <span className="w-1 h-1 bg-white rounded-full" />}
                    </span>
                    设为默认
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => navigate(`/c/addresses/edit/${a.id}`)}
                    className="flex items-center gap-1 px-3 text-[12px] text-text-secondary"
                  >
                    <Pencil size={12} />
                    编辑
                  </button>
                  <button
                    onClick={() => {
                      remove(a.id)
                      toast.success("已删除")
                    }}
                    className="flex items-center gap-1 px-3 text-[12px] text-primary"
                  >
                    <Trash2 size={12} />
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="px-3">
              <button onClick={loadMore} className="w-full py-3 text-[13px] text-primary font-medium">
                加载更多
              </button>
            </div>
          )}
        </>
      )}

      <div className="fixed left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-surface-page to-transparent pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <button
          onClick={() => navigate("/c/addresses/edit/new")}
          className="w-full h-11 rounded-full bg-primary text-white text-[14px] flex items-center justify-center gap-1 shadow-lg"
        >
          <Plus size={16} />
          添加新地址
        </button>
      </div>
    </div>
  )
}
