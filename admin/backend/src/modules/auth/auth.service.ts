import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/user.entity';

/**
 * 认证服务 — 处理登录校验、JWT 签发、用户信息查询
 */
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * 校验用户凭据 + 账号状态
   *
   * 校验流程：
   * 1. 根据用户名查找用户
   * 2. 对比密码哈希
   * 3. 检查账号状态是否为"正常"
   *
   * @param username 用户名
   * @param password 明文密码
   * @returns 校验通过的用户实体
   * @throws 401 用户名不存在或密码错误
   * @throws 403 账号状态异常（按状态类型返回不同提示）
   */
  async validateUser(username: string, password: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) throw new UnauthorizedException('用户不存在');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('密码错误');

    if (user.status !== UserStatus.NORMAL) {
      const statusMap: Record<string, string> = {
        [UserStatus.INACTIVE]: '账号未激活，请联系管理员',
        [UserStatus.LOCKED]: '账号已被锁定',
        [UserStatus.DISABLED]: '账号已被禁用',
        [UserStatus.RESIGNED]: '账号已离职',
      };
      throw new ForbiddenException(statusMap[user.status] || '账号状态异常');
    }

    return user;
  }

  /**
   * 登录 — 校验凭据后签发 JWT
   *
   * JWT payload: { sub: userId, username, roleId }
   * 有效期：7 天
   *
   * @returns access_token 及不包含密码的用户信息
   */
  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const isSuper = user.role?.isSuper || false;
    const payload = {
      sub: user.id,
      username: user.username,
      roleId: user.roleId,
      isSuper,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        roleId: user.roleId,
        status: user.status,
        isSuper,
      },
    };
  }

  /**
   * 获取当前登录用户完整信息（不含密码）
   *
   * @param userId 当前登录用户 ID
   * @throws 401 用户不存在
   */
  async getProfile(userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('用户不存在');
    const { password, ...result } = user;
    return result;
  }
}
