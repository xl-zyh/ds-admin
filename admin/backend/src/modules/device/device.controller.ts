import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { DeviceService } from './device.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { DevicePerm } from '../../common/permissions';
import type { Request } from 'express';

/**
 * 设备编码控制器
 *
 * 管理端：生成编码、扫描验证、查询记录、删除记录
 * 用户端：查询编码状态（无需登录）
 */
@Controller('devices')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  /** 生成设备编码 */
  @Post('generate')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(DevicePerm.GENERATE)
  async generate(@Body() data: {
    deviceName: string;
    deviceInfo?: string;
    port?: string;
    count?: number;
  }) {
    return this.deviceService.generate(data);
  }

  /** 扫描验证并使用编码 */
  @Post('scan')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(DevicePerm.SCAN)
  async scan(@Body('code') code: string, @Req() req: Request) {
    const operator = (req.user as any).nickname || (req.user as any).username;
    return this.deviceService.scanAndUse(code, operator);
  }

  /** 用户端查询编码状态（无需登录） */
  @Get('check')
  async check(@Query('code') code: string) {
    return this.deviceService.checkCode(code);
  }

  /** 管理端查询编码列表 */
  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(DevicePerm.READ)
  async list(@Query() params: {
    deviceName?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    return this.deviceService.list(params);
  }

  /** 管理员删除记录（软删除） */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission(DevicePerm.DELETE)
  async adminDelete(@Param('id') id: number) {
    return this.deviceService.adminDelete(id);
  }
}