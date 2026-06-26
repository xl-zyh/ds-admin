import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceCode } from './device-code.entity';
import { Role } from '../role/role.entity';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DeviceCode, Role])],
  controllers: [DeviceController],
  providers: [DeviceService],
  exports: [DeviceService],
})
export class DeviceModule {}