import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

/**
 * 角色实体 — 权限管理的基础单元
 *
 * 超管标记（isSuper）：
 * - 超管角色拥有系统最高管理权限，隐式拥有所有权限
 * - 删除时受保护：禁止删除最后一个活动的超管角色
 * - 创建时受限制：系统只能有一个超管角色
 *
 * 权限列表（permissions）：
 * - JSON 数组，存储权限码，如 ["user:read", "user:create", "role:read"]
 * - 超管角色此字段为空也可（isSuper 为 true 时隐式全权限）
 * - 非超管角色需显式配置权限列表
 *
 * 状态标记（isActive）：
 * - 禁用的角色不影响已有用户的角色关联，仅标识该角色暂不可用
 */
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  /** 角色名称，唯一标识 */
  @Column({ unique: true, length: 50 })
  name: string;

  /** 角色描述 */
  @Column({ length: 200, nullable: true })
  description: string;

  /** 是否为超级管理员角色 */
  @Column({ default: false })
  isSuper: boolean;

  /**
   * 权限码列表（JSON 数组）
   *
   * 超管角色此字段可留空，非超管角色需显式配置
   * 示例：["user:read", "user:create", "role:read"]
   */
  @Column({ type: 'json', nullable: true })
  permissions: string[];

  /** 是否启用 */
  @Column({ default: true })
  isActive: boolean;

  /** 创建时间，自动写入 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
