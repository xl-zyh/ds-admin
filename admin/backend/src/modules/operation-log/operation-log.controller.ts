import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { OperationLogPerm } from '../../common/permissions';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OperationLogController {
  constructor(private service: OperationLogService) {}

  /** GET /api/operation-logs — 分页查询操作日志 */
  @Get()
  @RequirePermission(OperationLogPerm.READ)
  findPage(
    @Query('username') username?: string,
    @Query('action') action?: string,
    @Query('resource') resource?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findPage({
      username,
      action,
      resource,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}