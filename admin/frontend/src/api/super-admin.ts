import http from './http'

export interface SuperAdminKeyStatus {
  initialized: boolean
  needRotation: boolean
  daysSinceSet: number
}

export interface SuperAdminKeyDetail extends SuperAdminKeyStatus {
  key?: string
  createdAt?: string
  setBy?: string
  needReset?: boolean
}

export const superAdminApi = {
  /** 设置/更换超管操作密钥 */
  setKey(key: string) {
    return http.post('/super-admin/keys/set', { key }).then((r) => r.data)
  },

  /** 校验操作密钥 */
  verifyKey(key: string) {
    return http.post('/super-admin/keys/verify', { key }).then((r) => r.data as { valid: boolean })
  },

  /** 获取密钥状态 */
  getStatus() {
    return http.get('/super-admin/keys/status').then((r) => r.data as SuperAdminKeyStatus)
  },

  /** 获取密钥详情（仅超管可见） */
  getDetail() {
    return http.get('/super-admin/keys/detail').then((r) => r.data as SuperAdminKeyDetail)
  },
}