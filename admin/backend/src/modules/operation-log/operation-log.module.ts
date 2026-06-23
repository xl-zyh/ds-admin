import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './operation-log.entity';
import { Role } from '../role/role.entity';
import { OperationLogService } from './operation-log.service';
import { OperationLogController } from './operation-log.controller';

import { LogCleanupTask } from './log-cleanup.task';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog, Role])],
  providers: [OperationLogService, LogCleanupTask],
  controllers: [OperationLogController],
  exports: [OperationLogService],
})
export class OperationLogModule {}