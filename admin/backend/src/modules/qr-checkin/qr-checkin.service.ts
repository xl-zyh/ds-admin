import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { QrCheckin } from './qr-checkin.entity';

/**
 * 二维码签到服务 — 场馆打卡数据采集与统计
 *
 * 核心功能：
 * 1. 接收设备上报的小时段聚合数据
 * 2. 按条件查询 + 分页
 * 3. 按场馆/区域/时间维度的聚合统计
 */
@Injectable()
export class QrCheckinService {
  constructor(
    @InjectRepository(QrCheckin)
    private repo: Repository<QrCheckin>,
  ) {}

  /**
   * 批量上报签到数据
   *
   * 支持单条或多条数据一次上报，如设备每小时上报一次当天全部时段数据
   */
  async batchUpload(data: Array<{
    provinceId: number;
    cityId: number;
    districtId: number;
    venueId: string;
    acqTime: string;
    acqNumOfPeople: number;
    leaNumOfPeople: number;
    deviceId: string;
    isCoreArea: number;
  }>): Promise<QrCheckin[]> {
    const records = data.map((item) =>
      this.repo.create({ ...item, acqTime: new Date(item.acqTime) }),
    );
    return this.repo.save(records);
  }

  /**
   * 分页查询签到记录
   *
   * @param query.venueId   场馆编号（可选）
   * @param query.provinceId 省份编号（可选）
   * @param query.cityId     城市编号（可选）
   * @param query.districtId 区县编号（可选）
   * @param query.startTime  采集时间起始（可选）
   * @param query.endTime    采集时间截止（可选）
   * @param query.page       页码，默认 1
   * @param query.pageSize   每页条数，默认 20
   */
  async findPage(query: {
    venueId?: string;
    provinceId?: number;
    cityId?: number;
    districtId?: number;
    startTime?: string;
    endTime?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const qb = this.repo.createQueryBuilder('qc');

    if (filters.venueId) qb.andWhere('qc.venueId = :venueId', { venueId: filters.venueId });
    if (filters.provinceId) qb.andWhere('qc.provinceId = :provinceId', { provinceId: filters.provinceId });
    if (filters.cityId) qb.andWhere('qc.cityId = :cityId', { cityId: filters.cityId });
    if (filters.districtId) qb.andWhere('qc.districtId = :districtId', { districtId: filters.districtId });
    if (filters.startTime) qb.andWhere('qc.acqTime >= :startTime', { startTime: filters.startTime });
    if (filters.endTime) qb.andWhere('qc.acqTime <= :endTime', { endTime: filters.endTime });

    qb.orderBy('qc.acqTime', 'DESC').addOrderBy('qc.venueId', 'ASC');

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /**
   * 按小时聚合统计 — 指定日期内各时段入场/出场汇总
   *
   * 返回样例：
   * [
   *   { hour: "2026-06-14 08:00:00", totalIn: 120, totalOut: 80 },
   *   { hour: "2026-06-14 09:00:00", totalIn: 200, totalOut: 150 },
   * ]
   */
  async statsByHour(params: {
    date: string;
    venueId?: string;
    provinceId?: number;
    cityId?: number;
    districtId?: number;
  }) {
    const qb = this.repo.createQueryBuilder('qc')
      .select('qc.acqTime', 'hour')
      .addSelect('SUM(qc.acqNumOfPeople)', 'totalIn')
      .addSelect('SUM(qc.leaNumOfPeople)', 'totalOut')
      .where('DATE(qc.acqTime) = :date', { date: params.date });

    if (params.venueId) qb.andWhere('qc.venueId = :venueId', { venueId: params.venueId });
    if (params.provinceId) qb.andWhere('qc.provinceId = :provinceId', { provinceId: params.provinceId });
    if (params.cityId) qb.andWhere('qc.cityId = :cityId', { cityId: params.cityId });
    if (params.districtId) qb.andWhere('qc.districtId = :districtId', { districtId: params.districtId });

    qb.groupBy('qc.acqTime').orderBy('qc.acqTime', 'ASC');

    return qb.getRawMany();
  }

  /**
   * 按场馆聚合统计 — 指定日期内各场馆入场/出场汇总
   */
  async statsByVenue(params: {
    date: string;
    provinceId?: number;
    cityId?: number;
    districtId?: number;
  }) {
    const qb = this.repo.createQueryBuilder('qc')
      .select('qc.venueId', 'venueId')
      .addSelect('SUM(qc.acqNumOfPeople)', 'totalIn')
      .addSelect('SUM(qc.leaNumOfPeople)', 'totalOut')
      .where('DATE(qc.acqTime) = :date', { date: params.date });

    if (params.provinceId) qb.andWhere('qc.provinceId = :provinceId', { provinceId: params.provinceId });
    if (params.cityId) qb.andWhere('qc.cityId = :cityId', { cityId: params.cityId });
    if (params.districtId) qb.andWhere('qc.districtId = :districtId', { districtId: params.districtId });

    qb.groupBy('qc.venueId');

    return qb.getRawMany();
  }
}