import type { VolunteerActivityStatus } from "../../store"
import { TextAction } from "./TextAction"

interface ActivityActionsProps {
  status: string
  onDetail: () => void
  onEdit: () => void
  onPublish: () => void
  onDelete: () => void
  onEnd: () => void
}

export function ActivityActions({ status, onDetail, onEdit, onPublish, onDelete, onEnd }: ActivityActionsProps) {
  const s = status as VolunteerActivityStatus
  return (
    <div className="inline-flex items-center gap-1 justify-end whitespace-nowrap">
      <TextAction label="详情" color="#2563EB" onClick={onDetail} />
      {s === "draft" && (
        <>
          <TextAction label="编辑" color="#2563EB" onClick={onEdit} />
          <TextAction label="发布" color="#059669" onClick={onPublish} />
          <TextAction label="删除" color="#DC2626" bg="#FEF2F2" onClick={onDelete} />
        </>
      )}
      {(s === "published" || s === "in_progress") ? (
        <TextAction label="结束活动" color="#DC2626" bg="#FEF2F2" onClick={onEnd} />
      ) : null}
    </div>
  )
}