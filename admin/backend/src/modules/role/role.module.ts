import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { PermissionGuard } from '../../common/guards/permission.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RoleService, PermissionGuard],
  controllers: [RoleController],
  exports: [RoleService, PermissionGuard],
})
export class RoleModule {}
