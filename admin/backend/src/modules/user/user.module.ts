import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Role } from '../role/role.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RoleModule } from '../role/role.module';
import { SuperAdminModule } from '../super-admin/super-admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role]), RoleModule, SuperAdminModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
