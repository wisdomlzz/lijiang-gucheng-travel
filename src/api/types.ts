export interface ApiResponse<T> {
  ok: boolean
  data: T
  msg: string
  code?: number
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ListParams = Record<string, string | number | boolean | undefined>