/**
 * 系统权限定义 — 所有权限码及分组
 *
 * 权限命名规范：{resource}:{action}
 * - resource: 资源模块（users / roles / system）
 * - action: 操作类型（read / create / update / delete）
 *
 * 超管角色（isSuper = true）隐式拥有所有权限，无需显式分配。
 */

/** 用户管理权限 */
export const UserPerm = {
  READ: 'user:read',
  CREATE: 'user:create',
  UPDATE: 'user:update',
  DELETE: 'user:delete',
} as const;

/** 角色管理权限 */
export const RolePerm = {
  READ: 'role:read',
  CREATE: 'role:create',
  UPDATE: 'role:update',
  DELETE: 'role:delete',
} as const;

/** 所有权限码的集合 */
export const ALL_PERMISSIONS = [
  ...Object.values(UserPerm),
  ...Object.values(RolePerm),
] as const;

/** 权限码类型 */
export type PermissionCode = (typeof ALL_PERMISSIONS)[number];