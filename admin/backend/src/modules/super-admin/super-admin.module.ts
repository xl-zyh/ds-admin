import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminKey } from './super-admin-key.entity';
import { SuperAdminKeyHistory } from './super-admin-key-history.entity';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SuperAdminKey, SuperAdminKeyHistory])],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}