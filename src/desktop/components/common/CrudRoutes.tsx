import { Route } from "react-router"
import { ReactNode } from "react"

export function CrudRoutes({
  list,
  create,
  show,
  edit,
}: {
  list: ReactNode
  create?: ReactNode
  show?: ReactNode
  edit?: ReactNode
}) {
  return (
    <>
      <Route index element={list} />
      {create && <Route path="new" element={create} />}
      {show && <Route path=":id" element={show} />}
      {edit && <Route path=":id/edit" element={edit} />}
    </>
  )
}
