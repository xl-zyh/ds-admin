import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

/** 认证状态管理 — JWT token + 用户信息 + 路由守卫验证 + 权限 */
export const useAuthStore = defineStore('auth', () => {
  const token = ref(sessionStorage.getItem('token') || '')
  const user = ref<any>(null)
  const verified = ref(false) // 是否已通过服务端验证（token 有效 + 状态正常）
  const isSuper = ref(false) // 当前用户是否为超管
  const permissions = ref<string[]>([]) // 当前用户的权限码列表

  const isLoggedIn = computed(() => !!token.value)

  /**
   * 检查当前用户是否拥有指定权限
   * 超管隐式拥有所有权限
   */
  function hasPermission(code: string): boolean {
    if (isSuper.value) return true
    return permissions.value.includes(code)
  }

  /** 登录：保存 token → 拉取完整用户信息（含角色权限） */
  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    token.value = res.access_token
    sessionStorage.setItem('token', res.access_token)
    // 必须调 fetchProfile 才能拿到 role.permissions，否则路由守卫权限校验会失败
    await fetchProfile()
    verified.value = true
    return res
  }

  /** 退出：清除 token 和用户信息 */
  function logout() {
    token.value = ''
    user.value = null
    isSuper.value = false
    permissions.value = []
    verified.value = false
    sessionStorage.removeItem('token')
  }

  /** 获取当前用户完整信息（用于刷新页面后恢复用户状态） */
  async function fetchProfile() {
    const res = await authApi.profile()
    user.value = res
    isSuper.value = res.role?.isSuper || false
    permissions.value = res.role?.permissions || []
    return res
  }

  /**
   * 路由守卫专用：验证 token 有效性 + 账号状态
   *
   * 1. 本地无 token → 直接返回 false
   * 2. 有 token 但未验证过 → 调 /auth/profile 验证
   *    - 401 → token 失效，清除并返回 false
   *    - status !== 'normal' → 账号异常，返回 false
   *    - 正常 → 缓存结果，返回 true
   * 3. 已验证过 → 直接返回 true（同一次会话内跳过重复请求）
   */
  async function checkAuth(): Promise<{ ok: boolean; reason?: string }> {
    if (!token.value) {
      return { ok: false, reason: '未登录' }
    }

    if (verified.value) {
      return { ok: true }
    }

    try {
      const profile = await fetchProfile()

      if (profile.status !== 'normal') {
        const statusMap: Record<string, string> = {
          inactive: '账号未激活',
          locked: '账号已被锁定',
          disabled: '账号已被禁用',
          resigned: '账号已离职',
        }
        return { ok: false, reason: statusMap[profile.status] || '账号状态异常' }
      }

      verified.value = true
      return { ok: true }
    } catch {
      // 401 或其他网络错误，token 无效
      logout()
      return { ok: false, reason: '登录已过期，请重新登录' }
    }
  }

  return { token, user, verified, isSuper, permissions, isLoggedIn, hasPermission, login, logout, fetchProfile, checkAuth }
})