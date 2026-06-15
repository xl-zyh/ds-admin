import { SetMetadata } from '@nestjs/common';
import type { PermissionCode } from '../permissions';

/** 元数据 key，PermissionGuard 通过此 key 读取所需权限 */
export const PERMISSION_KEY = 'required_permission';

/**
 * 权限装饰器 — 标记接口所需的最小权限
 *
 * 用法：
 *   @RequirePermission('user:create')
 *   @Post()
 *   create() { ... }
 *
 * 权限检查逻辑在 PermissionGuard 中：
 * - 超管角色（isSuper = true）→ 直接放行
 * - 非超管角色 → 检查其 permissions 数组是否包含所需权限码
 */
export const RequirePermission = (permission: PermissionCode) =>
  SetMetadata(PERMISSION_KEY, permission);