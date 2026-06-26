import http from './http'

/** 用户管理 API — 管理员创建/编辑/删除账号（系统不开放公开注册） */
export const userApi = {
  /** GET /users — 获取所有用户（含关联角色） */
  list() {
    return http.get('/users').then((r) => r.data)
  },
  /** POST /users — 管理员创建账号，返回用户 + 随机密码 */
  create(data: { username: string; email: string; password?: string; nickname?: string; roleId?: number }) {
    return http.post('/users', data).then((r) => r.data)
  },
  /** PUT /users/:id — 更新用户信息（含状态变更、激活） */
  update(id: number, data: Partial<{ nickname: string; email: string; roleId: number; status: string }>) {
    return http.put(`/users/${id}`, data).then((r) => r.data)
  },
  /** DELETE /users/:id — 删除用户（超管需附带 superAdminKey） */
  remove(id: number, superAdminKey?: string) {
    return http.delete(`/users/${id}`, { data: superAdminKey ? { superAdminKey } : undefined }).then((r) => r.data)
  },
}
