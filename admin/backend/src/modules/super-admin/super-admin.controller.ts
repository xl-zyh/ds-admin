import { Controller, Post, Body, Get, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminService } from './super-admin.service';
import type { Request } from 'express';

@Controller('super-admin')
@UseGuards(JwtAuthGuard)
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  private ensureSuperAdmin(req: Request) {
    const user = req.user as any;
    if (!user.isSuper) {
      throw new ForbiddenException('仅超级管理员有权限访问');
    }
  }

  /** 初始化或更换超管操作密钥 */
  @Post('keys/set')
  async setKey(@Body('key') key: string, @Req() req: Request) {
    this.ensureSuperAdmin(req);
    await this.superAdminService.setKey(key, (req.user as any).username);
    return { message: '超管操作密钥已更新' };
  }

  /** 校验操作密钥（用于操作前验证） */
  @Post('keys/verify')
  async verify(@Body('key') key: string): Promise<{ valid: boolean }> {
    const valid = await this.superAdminService.verify(key);
    return { valid };
  }

  /** 检查密钥状态 */
  @Get('keys/status')
  async status() {
    const initialized = await this.superAdminService.isInitialized();
    const rotation = await this.superAdminService.checkRotation();
    return { initialized, ...rotation };
  }

  /** 获取密钥详情（仅超管可见） */
  @Get('keys/detail')
  async detail(@Req() req: Request) {
    this.ensureSuperAdmin(req); 
    return this.superAdminService.getKeyDetail();
  }

}