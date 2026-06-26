import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 超级管理员操作密钥 — 操作超管账号时的最高权限验证码
 *
 * 规则：
 * - 口令长度 ≥ 16 位，含大小写字母、数字、特殊字符
 * - 每 90 天强制更换
 * - 不得与前 5 次口令重复
 *
 * 存储策略：
 * - passwordHash: bcrypt 哈希，用于验证
 * - encryptedKey: AES 加密的明文，用于超管查看
 */
@Entity('super_admin_keys')
export class SuperAdminKey {
  @PrimaryGeneratedColumn()
  id: number;

  /** 口令哈希（bcrypt），用于验证 */
  @Column({ length: 255 })
  passwordHash: string;

  /** 加密后的口令明文（AES-GCM），用于查看 */
  @Column({ type: 'text' })
  encryptedKey: string;

  /** 加密初始化向量（IV） */
  @Column({ length: 32 })
  iv: string;

  /** 设置时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /** 设置人用户名 */
  @Column({ length: 50 })
  setBy: string;
}