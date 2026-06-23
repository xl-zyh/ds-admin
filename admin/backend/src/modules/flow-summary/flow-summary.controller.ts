import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FlowSummaryService } from './flow-summary.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { FlowSummaryPerm } from '../../common/permissions';

@Controller('flow-summary')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FlowSummaryController {
  constructor(private service: FlowSummaryService) {}

  /** GET /api/flow-summary — 分页查询客流明细 */
  @Get()
  @RequirePermission(FlowSummaryPerm.READ)
  findPage(
    @Query('venueId') venueId?: string,
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findPage({
      venueId,
      provinceId: provinceId ? Number(provinceId) : undefined,
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}