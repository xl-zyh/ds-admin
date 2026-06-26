import http from './http'

export interface DeviceCodeRecord {
  id: number
  code: string
  deviceName: string
  deviceInfo: string | null
  port: string | null
  status: string
  usedAt: string | null
  usedBy: string | null
  createdAt: string
}

export interface DeviceCodePageResult {
  list: DeviceCodeRecord[]
  total: number
  page: number
  pageSize: number
}

export const deviceApi = {
  /** 生成设备编码 */
  generate(data: { deviceName: string; deviceInfo?: string; port?: string; count?: number }) {
    return http.post('/devices/generate', data).then((r) => r.data as DeviceCodeRecord[])
  },

  /** 扫描验证并使用编码 */
  scan(code: string) {
    return http.post('/devices/scan', { code }).then((r) => r.data as DeviceCodeRecord)
  },

  /** 用户端查询编码状态 */
  check(code: string) {
    return http.get('/devices/check', { params: { code } }).then((r) => r.data as DeviceCodeRecord)
  },

  /** 管理端查询编码列表 */
  list(params: {
    deviceName?: string
    status?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) {
    return http.get('/devices', { params }).then((r) => r.data as DeviceCodePageResult)
  },

  /** 管理员删除记录 */
  remove(id: number) {
    return http.delete(`/devices/${id}`).then((r) => r.data)
  },
}