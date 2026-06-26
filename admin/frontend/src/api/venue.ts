import http from './http'

export interface VenueRecord {
  id: number
  name: string
  address?: string
  lat: number
  lng: number
  provinceId?: number
  cityId?: number
  districtId?: number
  createdAt: string
}

export const venueApi = {
  /** 查询所有场馆 */
  list(keyword?: string) {
    return http.get('/venues', { params: { keyword } }).then((r) => r.data)
  },
  /** 新增场馆 */
  create(data: Partial<VenueRecord>) {
    return http.post('/venues', data).then((r) => r.data)
  },
  /** 更新场馆 */
  update(id: number, data: Partial<VenueRecord>) {
    return http.put(`/venues/${id}`, data).then((r) => r.data)
  },
  /** 删除场馆 */
  remove(id: number) {
    return http.delete(`/venues/${id}`).then((r) => r.data)
  },
}