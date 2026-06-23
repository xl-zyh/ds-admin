import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlowSummary } from './flow-summary.entity';
import { Role } from '../role/role.entity';
import { FlowSummaryService } from './flow-summary.service';
import { FlowSummaryController } from './flow-summary.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FlowSummary, Role])],
  providers: [FlowSummaryService],
  controllers: [FlowSummaryController],
  exports: [FlowSummaryService],
})
export class FlowSummaryModule {}