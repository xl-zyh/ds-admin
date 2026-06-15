import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

/**
 * 认证控制器 — 登录 / 获取当前用户信息
 *
 * @routePrefix /api/auth
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 用户登录
   *
   * @route POST /api/auth/login
   * @auth 无需认证（公开接口）
   * @param body.username 用户名
   * @param body.password 密码
   * @returns { access_token: string, user: { id, username, nickname, email, roleId, status } }
   *
   * @throws 401 用户名或密码错误
   * @throws 403 账号状态异常（未激活/锁定/禁用/离职）
   *
   * @note 只有"正常"状态的账号才能登录成功
   */
  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  /**
   * 获取当前登录用户信息
   *
   * @route GET /api/auth/profile
   * @auth 需要 JWT 认证（Header: Authorization: Bearer <token>）
   * @returns 用户对象（不含密码字段）
   * @throws 401 未登录或 token 无效
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }
}
