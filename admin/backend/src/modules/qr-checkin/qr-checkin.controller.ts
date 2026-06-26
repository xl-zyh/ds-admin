import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { QrCheckinService } from './qr-checkin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { QrCheckinPerm } from '../../common/permissions';

/**
 * 二维码签到数据控制器 — 场馆扫码打卡数据上报与查询
 *
 * @routePrefix /api/qr-checkin
 * @auth 所有接口需要 JWT 认证
 */
@Controller('qr-checkin')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class QrCheckinController {
  constructor(private service: QrCheckinService) {}

  /**
   * 批量上报签到数据
   *
   * 设备按小时聚合后批量上报，单次可传多条
   *
   * @route POST /api/qr-checkin/batch
   * @permission qr-checkin:create
   * @body 签到数据数组
   */
  @Post('batch')
  @RequirePermission(QrCheckinPerm.CREATE)
  async batchUpload(@Body() data: Array<{
    provinceId: number;
    cityId: number;
    districtId: number;
    venueId: string;
    acqTime: string;
    acqNumOfPeople: number;
    leaNumOfPeople: number;
    deviceId: string;
    isCoreArea: number;
  }>) {
    return this.service.batchUpload(data);
  }

  /**
   * 分页查询签到记录
   *
   * @route GET /api/qr-checkin
   * @permission qr-checkin:read
   * @query venueId    场馆编号（可选）
   * @query provinceId 省份编号（可选）
   * @query cityId     城市编号（可选）
   * @query districtId 区县编号（可选）
   * @query startTime  采集时间起始（可选，yyyy-MM-dd HH:mm:ss）
   * @query endTime    采集时间截止（可选）
   * @query page       页码，默认 1
   * @query pageSize   每页条数，默认 20
   */
  @Get()
  @RequirePermission(QrCheckinPerm.READ)
  findPage(
    @Query('venueId') venueId?: string,
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.service.findPage({
      venueId,
      provinceId: provinceId ? Number(provinceId) : undefined,
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
      startTime,
      endTime,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  /**
   * 按小时聚合统计
   *
   * @route GET /api/qr-checkin/stats/hour
   * @permission qr-checkin:read
   * @query date      日期，必填（yyyy-MM-dd）
   * @query venueId   场馆编号（可选）
   * @query provinceId 省份编号（可选）
   * @query cityId     城市编号（可选）
   * @query districtId 区县编号（可选）
   * @query deviceId   
   */
  @Get('stats/hour')
  @RequirePermission(QrCheckinPerm.READ)
  statsByHour(
    @Query('date') date: string,
    @Query('venueId') venueId?: string,
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.service.statsByHour({
      date,
      venueId,
      provinceId: provinceId ? Number(provinceId) : undefined,
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
    });
  }

  /**
   * 按场馆聚合统计
   *
   * @route GET /api/qr-checkin/stats/venue
   * @permission qr-checkin:read
   * @query date       日期，必填（yyyy-MM-dd）
   * @query provinceId 省份编号（可选）
   * @query cityId     城市编号（可选）
   * @query districtId 区县编号（可选）
   */
  @Get('stats/venue')
  @RequirePermission(QrCheckinPerm.READ)
  statsByVenue(
    @Query('date') date: string,
    @Query('provinceId') provinceId?: string,
    @Query('cityId') cityId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.service.statsByVenue({
      date,
      provinceId: provinceId ? Number(provinceId) : undefined,
      cityId: cityId ? Number(cityId) : undefined,
      districtId: districtId ? Number(districtId) : undefined,
    });
  }
}