import http from './http'

/** 二维码签到数据 API — 批量上报 + 分页查询 + 按小时/场馆统计 */
export interface QrCheckinRecord {
  id: number
  provinceId: number
  cityId: number
  districtId: number
  venueId: string
  acqTime: string
  acqNumOfPeople: number
  leaNumOfPeople: number
  deviceId: string
  isCoreArea: number
  createdAt: string
}

export interface QrCheckinPageResult {
  list: QrCheckinRecord[]
  total: number
  page: number
  pageSize: number
}

export const qrCheckinApi = {
  /** POST /qr-checkin/batch — 批量上报签到数据 */
  batchUpload(data: Omit<QrCheckinRecord, 'id' | 'createdAt'>[]) {
    return http.post('/qr-checkin/batch', data).then((r) => r.data)
  },
  /** GET /qr-checkin — 分页查询签到记录 */
  list(params: {
    venueId?: string
    provinceId?: number
    cityId?: number
    districtId?: number
    startTime?: string
    endTime?: string
    page?: number
    pageSize?: number
  }) {
    return http.get('/qr-checkin', { params }).then((r) => r.data as QrCheckinPageResult)
  },
  /** GET /qr-checkin/stats/hour — 按小时聚合统计 */
  statsByHour(date: string, params?: { venueId?: string; provinceId?: number; cityId?: number; districtId?: number }) {
    return http.get('/qr-checkin/stats/hour', { params: { date, ...params } }).then((r) => r.data)
  },
  /** GET /qr-checkin/stats/venue — 按场馆聚合统计 */
  statsByVenue(date: string, params?: { provinceId?: number; cityId?: number; districtId?: number }) {
    return http.get('/qr-checkin/stats/venue', { params: { date, ...params } }).then((r) => r.data)
  },
}