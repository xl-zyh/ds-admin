import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/index.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('../views/layout/index.vue'),
    meta: { requiresAuth: true },
    redirect: '/users',
    children: [
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/user/index.vue'),
        meta: { title: '用户管理', permission: 'user:read' },
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../views/role/index.vue'),
        meta: { title: '角色管理', permission: 'role:read' },
      },
      {
        path: 'qr-checkin',
        name: 'QrCheckin',
        component: () => import('../views/qr-checkin/index.vue'),
        meta: { title: '二维码签到', permission: 'qr-checkin:read' },
      },
      {
        path: 'flow-summary',
        name: 'FlowSummary',
        component: () => import('../views/flow-summary/index.vue'),
        meta: { title: '客流明细', permission: 'flow-summary:read' },
      },
      {
        path: 'operation-logs',
        name: 'OperationLogs',
        component: () => import('../views/operation-log/index.vue'),
        meta: { title: '操作日志', permission: 'operation-log:read' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

/**
 * 全局路由守卫 — 验证登录态 + 账号状态 + 页面权限
 *
 * 流程：
 *   1. 目标页不需要登录 → 直接放行
 *   2. 目标页需要登录 → 调用 checkAuth()
 *      - token 无效 → 跳转 login
 *      - 状态非 normal → 跳转 login
 *      - 验证通过 → 检查权限
 *   3. 检查页面权限（meta.permission）
 *      - 超管 → 直接放行
 *      - 有对应权限 → 放行
 *      - 无权限 → 跳转 login，提示"无权访问"
 *   4. 已登录访问 /login → 重定向到首页
 */
router.beforeEach(async (to, _, next) => {
  const auth = useAuthStore()

  // 访问不需要登录的页面 → 直接放行
  if (to.meta.requiresAuth === false) {
    if (to.path === '/login' && auth.token) {
      next('/')
      return
    }
    next()
    return
  }

  // 需要登录的页面 → 验证 token 有效性和账号状态
  const result = await auth.checkAuth()

  if (!result.ok) {
    ElMessage.error(result.reason || '请先登录')
    next('/login')
    return
  }

  // 检查页面权限
  const requiredPermission = to.meta.permission as string | undefined
  if (requiredPermission && !auth.hasPermission(requiredPermission)) {
    ElMessage.error('无权访问该页面')
    next('/login')
    return
  }

  next()
})

export default router
