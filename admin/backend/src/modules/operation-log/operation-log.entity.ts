import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * 操作日志实体 — 记录后台管理员的所有操作
 *
 * 自动清理：每日 23:50 清理 7 天前的日志
 */
@Entity('operation_logs')
@Index(['createdAt'])
@Index(['username'])
export class OperationLog {
  @PrimaryGeneratedColumn()
  id: number;

  /** 操作人用户名 */
  @Column({ length: 50 })
  username: string;

  /** 操作人昵称 */
  @Column({ length: 50, nullable: true })
  nickname: string;

  /** 操作人角色名 */
  @Column({ length: 50, nullable: true })
  roleName: string;

  /** 操作类型：CREATE / UPDATE / DELETE / LOGIN / EXPORT */
  @Column({ length: 20 })
  action: string;

  /** 目标资源：用户管理 / 角色管理 / 二维码签到 / 客流明细 / 操作日志 */
  @Column({ length: 50 })
  resource: string;

  /** 操作详情 */
  @Column({ type: 'text', nullable: true })
  detail: string;

  /** 请求 IP */
  @Column({ length: 50, nullable: true })
  ip: string;

  /** 操作时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}