import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 设备唯一编码实体
 *
 * 规则：
 * - 编码格式：DEV-YYYYMMDD-XXXXXX（日期 + 6位随机码）
 * - 一经使用即标记为已使用，不可二次使用
 * - 管理员删除记录仅隐藏管理端显示，用户端仍可见
 */
@Entity('device_codes')
export class DeviceCode {
  @PrimaryGeneratedColumn()
  id: number;

  /** 唯一设备编码，全局唯一 */
  @Column({ length: 30, unique: true })
  code: string;

  /** 设备名称（用户输入） */
  @Column({ length: 100 })
  deviceName: string;

  /** 设备信息（JSON 格式，存储额外字段） */
  @Column({ type: 'text', nullable: true })
  deviceInfo: string;

  /** 关联端口号 */
  @Column({ length: 20, nullable: true })
  port: string;

  /** 状态：available | used */
  @Column({ length: 20, default: 'available' })
  status: string;

  /** 使用时间 */
  @Column({ type: 'timestamp', nullable: true })
  usedAt: Date;

  /** 使用操作人 */
  @Column({ length: 50, nullable: true })
  usedBy: string;

  /** 创建时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /** 管理员是否已隐藏（软删除） */
  @Column({ default: false })
  adminHidden: boolean;
}