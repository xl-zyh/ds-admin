import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrCheckin } from './qr-checkin.entity';
import { Role } from '../role/role.entity';
import { QrCheckinService } from './qr-checkin.service';
import { QrCheckinController } from './qr-checkin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QrCheckin, Role])],
  providers: [QrCheckinService],
  controllers: [QrCheckinController],
  exports: [QrCheckinService],
})
export class QrCheckinModule {}