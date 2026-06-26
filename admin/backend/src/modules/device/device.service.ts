import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { DeviceCode } from './device-code.entity';

/**
 * 生成唯一设备编码
 * 格式：DEV-YYYYMMDD-XXXXXX（6位随机大写字母+数字）
 */
function generateCode(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除易混淆字符 0/O/1/I
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `DEV-${date}-${random}`;
}

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(DeviceCode)
    private codeRepo: Repository<DeviceCode>,
  ) {}

  /**
   * 生成设备编码（可批量）
   */
  async generate(data: {
    deviceName: string;
    deviceInfo?: string;
    port?: string;
    count?: number;
  }): Promise<DeviceCode[]> {
    const count = data.count || 1;
    if (count < 1 || count > 100) {
      throw new BadRequestException('单次生成数量 1-100');
    }

    const codes: DeviceCode[] = [];
    for (let i = 0; i < count; i++) {
      let code = generateCode();
      // 确保唯一性（极小概率碰撞，重试一次）
      let retries = 0;
      let exists = true;
      while (exists && retries < 5) {
        exists = !!(await this.codeRepo.findOneBy({ code }));
        if (exists) {
          code = generateCode();
          retries++;
        }
      }
      if (retries >= 5) {
        throw new BadRequestException('编码生成失败，请重试');
      }

      const entity = Object.assign(new DeviceCode(), {
        code,
        deviceName: data.deviceName,
        deviceInfo: data.deviceInfo || null,
        port: data.port || null,
        status: 'available',
      });
      codes.push(entity);
    }

    return this.codeRepo.save(codes);
  }

  /**
   * 扫描验证并使用编码
   * - 验证编码是否存在
   * - 检查是否已使用（不可二次扫描）
   * - 标记为已使用并记录操作人
   */
  async scanAndUse(code: string, operator: string): Promise<DeviceCode> {
    const record = await this.codeRepo.findOneBy({ code });
    if (!record) {
      throw new NotFoundException('编码不存在');
    }
    if (record.status === 'used') {
      throw new BadRequestException(`编码 ${code} 已被使用，不可重复扫描`);
    }

    record.status = 'used';
    record.usedAt = new Date();
    record.usedBy = operator;
    return this.codeRepo.save(record);
  }

  /**
   * 用户端查询编码状态
   */
  async checkCode(code: string): Promise<DeviceCode> {
    const record = await this.codeRepo.findOneBy({ code });
    if (!record) {
      throw new NotFoundException('编码不存在');
    }
    return record;
  }

  /**
   * 管理端查询编码列表（支持时间筛选，近一个月默认）
   */
  async list(params: {
    deviceName?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const qb = this.codeRepo.createQueryBuilder('dc').where('dc.adminHidden = false');

    if (params.deviceName) {
      qb.andWhere('dc.deviceName LIKE :name', { name: `%${params.deviceName}%` });
    }
    if (params.status) {
      qb.andWhere('dc.status = :status', { status: params.status });
    }

    // 默认近一个月
    if (params.startDate) {
      qb.andWhere('dc.createdAt >= :start', { start: params.startDate });
    } else {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      qb.andWhere('dc.createdAt >= :defaultStart', { defaultStart: oneMonthAgo.toISOString() });
    }
    if (params.endDate) {
      qb.andWhere('dc.createdAt <= :end', { end: params.endDate + 'T23:59:59' });
    }

    qb.orderBy('dc.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  /**
   * 管理员删除记录（软删除，不影响用户端查询）
   */
  async adminDelete(id: number): Promise<void> {
    const record = await this.codeRepo.findOneBy({ id });
    if (!record) {
      throw new NotFoundException('记录不存在');
    }
    record.adminHidden = true;
    await this.codeRepo.save(record);
  }
}