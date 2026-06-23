import http from './http'

export interface FlowSummaryRecord {
  id: number
  equipmentCode: string
  time: string
  inCount: number
  outCount: number
  provinceId: number
  cityId: number
  districtId: number
  venueId: string
  createdAt: string
}

export interface FlowSummaryPageResult {
  list: FlowSummaryRecord[]
  total: number
  page: number
  pageSize: number
}

export const flowSummaryApi = {
  /** GET /flow-summary — 分页查询客流明细 */
  list(params: {
    venueId?: string
    provinceId?: number
    cityId?: number
    districtId?: number
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    return http.get('/flow-summary', { params }).then((r) => r.data as FlowSummaryPageResult)
  },
}