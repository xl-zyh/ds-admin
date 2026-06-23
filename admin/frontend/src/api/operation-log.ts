import http from './http'

export interface OperationLogRecord {
  id: number
  username: string
  nickname: string | null
  roleName: string | null
  action: string
  resource: string
  detail: string | null
  ip: string | null
  createdAt: string
}

export interface OperationLogPageResult {
  list: OperationLogRecord[]
  total: number
  page: number
  pageSize: number
}

export const operationLogApi = {
  /** GET /operation-logs — 分页查询操作日志 */
  list(params: {
    username?: string
    action?: string
    resource?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    return http.get('/operation-logs', { params }).then((r) => r.data as OperationLogPageResult)
  },
}