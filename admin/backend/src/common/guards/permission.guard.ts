import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../modules/role/role.entity';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import type { PermissionCode } from '../permissions';

/**
 * 权限守卫 — 校验当前用户是否拥有操作所需权限
 *
 * 校验流程：
 * 1. 从 @RequirePermission 装饰器读取所需权限码
 * 2. 未标记 @RequirePermission → 直接放行（仅需登录）
 * 3. 从 JWT payload 获取 roleId
 * 4. 查询角色 → 如果 isSuper → 直接放行
 * 5. 非超管 → 检查角色 permissions 数组是否包含所需权限码
 * 6. 不包含 → 403 Forbidden
 *
 * 注意：此守卫依赖 JwtAuthGuard 已执行（request.user 已注入）
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 读取装饰器标记的所需权限
    const required = this.reflector.getAllAndOverride<PermissionCode>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 未标记权限 → 仅需登录，直接放行
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 无用户信息 → 拒绝（理论上不会走到这里，JwtAuthGuard 会先拦截）
    if (!user) throw new ForbiddenException('未登录');

    // 超管 → 直接放行（隐式全权限）
    if (user.isSuper) return true;

    // 无角色 → 拒绝
    if (!user.roleId) throw new ForbiddenException('无权限');

    // 查询角色权限
    const role = await this.roleRepo.findOneBy({ id: user.roleId });
    if (!role || !role.isActive) throw new ForbiddenException('角色已禁用或不存在');

    // 超管角色 → 放行
    if (role.isSuper) return true;

    // 检查权限列表
    const perms: string[] = role.permissions || [];
    if (!perms.includes(required)) {
      throw new ForbiddenException(`权限不足：需要 ${required}`);
    }

    return true;
  }
}