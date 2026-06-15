import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserStatus } from './user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UserPerm } from '../../common/permissions';

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
  constructor(private userService: UserService) {}

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
   * @route PUT /api/users/:id
   * @permission user:update
   */
  @Put(':id')
  @RequirePermission(UserPerm.UPDATE)
  update(@Param('id') id: number, @Body() data: Partial<{
    nickname: string;
    email: string;
    roleId: number;
    status: UserStatus;
  }>) {
    return this.userService.update(id, data);
  }

  /**
   * 删除用户（硬删除）
   *
   * @route DELETE /api/users/:id
   * @permission user:delete
   */
  @Delete(':id')
  @RequirePermission(UserPerm.DELETE)
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }
}