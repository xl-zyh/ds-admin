import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { QrCheckinModule } from './modules/qr-checkin/qr-checkin.module';
import { FlowSummaryModule } from './modules/flow-summary/flow-summary.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { LogInterceptor } from './common/interceptors/log.interceptor';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456',
      database: process.env.DB_NAME || 'admin_system',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    UserModule,
    AuthModule,
    RoleModule,
    QrCheckinModule,
    FlowSummaryModule,
    OperationLogModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LogInterceptor },
  ],
})
export class AppModule {}
