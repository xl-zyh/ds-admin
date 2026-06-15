import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from '../role/role.entity';

/**
 * 用户状态枚举 — 5 种生命周期状态
 *
 * normal   — 正常，可正常登录使用
 * inactive — 未激活，管理员创建后的默认状态，不可登录
 * locked   — 已锁定，如多次密码错误或安全锁定，不可登录
 * disabled — 已禁用，管理员主动禁用，不可登录
 * resigned — 已离职，保留记录但不可登录
 *
 * 只有 `normal` 状态允许登录。
 */
export enum UserStatus {
  NORMAL = 'normal',
  INACTIVE = 'inactive',
  LOCKED = 'locked',
  DISABLED = 'disabled',
  RESIGNED = 'resigned',
}

/**
 * 用户实体 — 系统用户的数据库映射
 *
 * 关联：多对一 → 角色（Role），可通过 roleId 外键关联
 *
 * 安全规则：
 * - 密码以 bcrypt(10) 哈希存储，无明文落库
 * - token 信息见 auth.service.ts JWT payload 定义
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户名，唯一，用于登录 */
  @Column({ unique: true, length: 50 })
  username: string;

  /** 邮箱，唯一 */
  @Column({ unique: true, length: 100 })
  email: string;

  /** 密码，bcrypt 哈希，严禁明文 */
  @Column()
  password: string;

  /** 昵称 / 显示名 */
  @Column({ length: 50, nullable: true })
  nickname: string;

  /** 账号状态，默认"未激活"，须由管理员激活后方可登录 */
  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.INACTIVE })
  status: UserStatus;

  /** 角色外键，默认 NULL = 观察者（最小权限） */
  @Column({ type: 'int', nullable: true })
  roleId: number;

  /** 关联的角色对象，查询时通过 relations 加载 */
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  /** 创建时间，自动写入 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
