import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { RolePerm } from '../../common/permissions';

/**
 * 角色管理控制器 — CRUD + 超级管理员保护
 *
 * @routePrefix /api/roles
 * @auth 所有接口需要 JWT 认证 + 权限验证
 */
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RoleController {
  constructor(private roleService: RoleService) {}

  /**
   * 获取所有角色列表
   *
   * @route GET /api/roles
   * @permission role:read
   */
  @Get()
  @RequirePermission(RolePerm.READ)
  findAll() {
    return this.roleService.findAll();
  }

  /**
   * 创建角色
   *
   * @route POST /api/roles
   * @param data.name 角色名称（必填）
   * @param data.description 描述（可选）
   * @param data.isSuper 是否为超级管理员角色（默认 false）
   * @param data.permissions 权限码列表（可选，超管角色可忽略）
   * @permission role:create
   *
   * @note 超管角色拥有最高权限，请谨慎设置
   */
  @Post()
  @RequirePermission(RolePerm.CREATE)
  create(@Body() data: {
    name: string;
    description?: string;
    isSuper?: boolean;
    permissions?: string[];
  }) {
    return this.roleService.create(data);
  }

  /**
   * 更新角色信息（含权限配置）
   *
   * @route PUT /api/roles/:id
   * @param id 角色 ID
   * @param data.permissions 新权限列表（可选）
   * @permission role:update
   */
  @Put(':id')
  @RequirePermission(RolePerm.UPDATE)
  update(@Param('id') id: number, @Body() data: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    isSuper: boolean;
    permissions: string[];
  }>) {
    return this.roleService.update(id, data);
  }

  /**
   * 删除角色
   *
   * @permission role:delete
   * @throws 403 禁止删除最后一个超管角色
   */
  @Delete(':id')
  @RequirePermission(RolePerm.DELETE)
  remove(@Param('id') id: number) {
    return this.roleService.remove(id);
  }
}