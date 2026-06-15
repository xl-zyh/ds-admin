import http from './http'

/** 认证相关 API — 登录 + 获取用户信息（系统不开放公开注册） */
export const authApi = {
  /** POST /auth/login — 用户登录，返回 JWT token + 用户信息 */
  login(username: string, password: string) {
    return http.post('/auth/login', { username, password }).then((r) => r.data)
  },
  /** GET /auth/profile — 获取当前登录用户信息（需 JWT） */
  profile() {
    return http.get('/auth/profile').then((r) => r.data)
  },
}
