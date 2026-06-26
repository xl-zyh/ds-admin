import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { UserStatus } from './user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UserPerm } from '../../common/permissions';
import { SuperAdminService } from '../super-admin/super-admin.service';

/**
 * 用户管理控制器 — 管理员创建/编辑/删除账号
 *
 * 本系统不开放公开注册。所有账号由管理员通过以下方式创建：
 * 1. POST /users — 管理员直接创建（生成随机密码）
 * 2. 未来可扩展：邀请邮件链接、工单审批后开通
 *
 * @routePrefix /api/users
 * @auth 所有接口需要 JWT 认证 + 权限验证
 */
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private superAdminService: SuperAdminService,
  ) {}

  /**
   * 获取所有用户列表（含关联角色信息）
   *
   * @route GET /api/users
   * @permission user:read
   */
  @Get()
  @RequirePermission(UserPerm.READ)
  findAll() {
    return this.userService.findAll();
  }

  /**
   * 根据 ID 获取单个用户
   *
   * @route GET /api/users/:id
   * @permission user:read
   */
  @Get(':id')
  @RequirePermission(UserPerm.READ)
  findById(@Param('id') id: number) {
    return this.userService.findById(id);
  }

  /**
   * 管理员创建账号（邀请制）
   *
   * @route POST /api/users
   * @permission user:create
   */
  @Post()
  @RequirePermission(UserPerm.CREATE)
  create(@Body() data: {
    username: string;
    email: string;
    password?: string;
    nickname?: string;
    roleId?: number;
  }) {
    return this.userService.createByAdmin(data);
  }

  /**
   * 更新用户信息（含状态管理）
   *
   * 超管保护：修改超管账号需提供超管操作密钥，且禁止将超管状态设为非正常
   *
   * @route PUT /api/users/:id
   * @permission user:update
   */
  @Put(':id')
  @RequirePermission(UserPerm.UPDATE)
  async update(@Param('id') id: number, @Body() data: Partial<{
    nickname: string;
    email: string;
    roleId: number;
    status: UserStatus;
    superAdminKey?: string;
  }>) {
    await this.verifySuperAdminKeyIfNeeded(id, data);
    return this.userService.update(id, data);
  }

  /**
   * 删除用户（硬删除）
   *
   * 超管保护：删除超管账号需提供超管操作密钥
   *
   * @route DELETE /api/users/:id
   * @permission user:delete
   */
  @Delete(':id')
  @RequirePermission(UserPerm.DELETE)
  async remove(@Param('id') id: number, @Body() data: { superAdminKey?: string }) {
    await this.verifySuperAdminKeyIfNeeded(id, data);
    return this.userService.remove(id);
  }

  /**
   * 如果是超管账号，校验操作密钥
   */
  private async verifySuperAdminKeyIfNeeded(id: number, data: { superAdminKey?: string }) {
    const target = await this.userService.findById(id);
    if (!target) return;

    const isSuperAdmin = target.role?.isSuper;
    if (!isSuperAdmin) return;

    if (!data.superAdminKey) {
      throw new ForbiddenException('操作超管账号需要提供超管操作密钥');
    }

    const valid = await this.superAdminService.verify(data.superAdminKey);
    if (!valid) {
      throw new ForbiddenException('超管操作密钥验证失败');
    }
  }
}