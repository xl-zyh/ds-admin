import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OperationLogService } from '../../modules/operation-log/operation-log.service';

/**
 * 操作日志清理任务 — 每日 23:50 清理 7 天前的日志
 */
@Injectable()
export class LogCleanupTask {
  private readonly logger = new Logger(LogCleanupTask.name);

  constructor(private logService: OperationLogService) {}

  @Cron('50 23 * * *')
  async handleCleanup() {
    this.logger.log('开始清理 7 天前的操作日志...');
    const deleted = await this.logService.cleanExpired();
    this.logger.log(`清理完成，共删除 ${deleted} 条记录`);
  }
}