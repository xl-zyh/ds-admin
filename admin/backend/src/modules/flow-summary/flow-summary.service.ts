import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { FlowSummary } from './flow-summary.entity';

@Injectable()
export class FlowSummaryService {
  constructor(
    @InjectRepository(FlowSummary)
    private repo: Repository<FlowSummary>,
  ) {}

  /** 分页查询客流汇总记录 */
  async findPage(query: {
    venueId?: string;
    provinceId?: number;
    cityId?: number;
    districtId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const qb = this.repo.createQueryBuilder('fs');

    if (filters.venueId) qb.andWhere('fs.venueId = :venueId', { venueId: filters.venueId });
    if (filters.provinceId) qb.andWhere('fs.provinceId = :provinceId', { provinceId: filters.provinceId });
    if (filters.cityId) qb.andWhere('fs.cityId = :cityId', { cityId: filters.cityId });
    if (filters.districtId) qb.andWhere('fs.districtId = :districtId', { districtId: filters.districtId });
    if (filters.startDate) qb.andWhere('fs.time >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('fs.time <= :endDate', { endDate: filters.endDate });

    qb.orderBy('fs.time', 'DESC').addOrderBy('fs.venueId', 'ASC');

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }
}