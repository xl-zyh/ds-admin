import http from './http'

/** 角色管理 API — CRUD + 超管保护 */
export const roleApi = {
  /** GET /roles — 获取角色列表 */
  list() {
    return http.get('/roles').then((r) => r.data)
  },
  /** POST /roles — 创建角色（可指定 isSuper 标记 + 权限列表） */
  create(data: { name: string; description?: string; isSuper?: boolean; permissions?: string[] }) {
    return http.post('/roles', data).then((r) => r.data)
  },
  /** PUT /roles/:id — 更新角色信息（含权限配置） */
  update(id: number, data: Partial<{ name: string; description: string; isActive: boolean; isSuper: boolean; permissions: string[] }>) {
    return http.put(`/roles/${id}`, data).then((r) => r.data)
  },
  /** DELETE /roles/:id — 删除角色（超管受保护） */
  remove(id: number) {
    return http.delete(`/roles/${id}`).then((r) => r.data)
  },
}
