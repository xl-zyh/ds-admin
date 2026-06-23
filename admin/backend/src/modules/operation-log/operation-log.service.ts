import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OperationLog } from './operation-log.entity';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private repo: Repository<OperationLog>,
  ) {}

  /** 保存操作日志 */
  save(log: Partial<OperationLog>) {
    return this.repo.save(this.repo.create(log));
  }

  /** 分页查询操作日志 */
  async findPage(query: {
    username?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const qb = this.repo.createQueryBuilder('log');

    if (filters.username) qb.andWhere('log.username LIKE :username', { username: `%${filters.username}%` });
    if (filters.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters.resource) qb.andWhere('log.resource = :resource', { resource: filters.resource });
    if (filters.startDate) qb.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });

    qb.orderBy('log.createdAt', 'DESC');

    const [list, total] = await qb
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total, page, pageSize };
  }

  /** 清理 7 天前的日志 */
  async cleanExpired() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const result = await this.repo.delete({ createdAt: LessThan(sevenDaysAgo) });
    return result.affected || 0;
  }
}