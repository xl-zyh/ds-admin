import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT 策略 — 解析 Bearer Token，提取用户信息挂载到 request.user
 *
 * request.user 结构：
 *   { sub: userId, username: string, roleId: number | null, isSuper: boolean }
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'admin-system-secret-key-2026',
    });
  }

  async validate(payload: {
    sub: number;
    username: string;
    roleId: number | null;
    isSuper: boolean;
  }) {
    return {
      sub: payload.sub,
      username: payload.username,
      roleId: payload.roleId,
      isSuper: payload.isSuper,
    };
  }
}
