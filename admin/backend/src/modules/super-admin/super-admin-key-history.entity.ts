import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 超级管理员密钥历史 — 防止与新口令重复
 */
@Entity('super_admin_key_history')
export class SuperAdminKeyHistory {
  @PrimaryGeneratedColumn()
  id: number;

  /** 口令哈希 */
  @Column({ length: 255 })
  passwordHash: string;

  /** 设置时间 */
  @Column({ type: 'timestamp' })
  createdAt: Date;

  /** 设置人 */
  @Column({ length: 50 })
  setBy: string;
}