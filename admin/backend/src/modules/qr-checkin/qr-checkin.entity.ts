import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * 二维码签到记录实体 — 场馆扫码打卡数据
 *
 * 数据以小时为单位聚合上报，每条记录代表一个时间段：
 *   acqTime = 18:00 表示统计的是 17:00-18:00 时段的进场/出场人数
 *
 * 行政区划编码参照 GB/T 2260-2007
 * 场馆编号参照《体育场馆信息化管理服务系统技术规范》
 */
@Entity('qr_checkins')
@Index(['venueId', 'acqTime'])
@Index(['provinceId', 'cityId', 'districtId'])
export class QrCheckin {
  @PrimaryGeneratedColumn()
  id: number;

  /** 省份编号，参照 GB/T 2260-2007 */
  @Column({ type: 'int' })
  provinceId: number;

  /** 城市编号，参照 GB/T 2260-2007 */
  @Column({ type: 'int' })
  cityId: number;

  /** 区县编号，参照 GB/T 2260-2007 */
  @Column({ type: 'int' })
  districtId: number;

  /** 场馆编号，参照《体育场馆信息化管理服务系统技术规范》 */
  @Column({ length: 50 })
  venueId: string;

  /**
   * 采集时间
   *
   * 格式 yyyy-MM-dd HH:mm:ss
   * 含义：小时段结束时间，如 18:00:00 代表 17:00-18:00 时段
   */
  @Column({ type: 'datetime' })
  acqTime: Date;

  /** 入场人数（进入场馆的扫码人数） */
  @Column({ type: 'int' })
  acqNumOfPeople: number;

  /** 出场人数（离开场馆的扫码人数） */
  @Column({ type: 'int' })
  leaNumOfPeople: number;

  /** 设备编号 */
  @Column({ length: 50 })
  deviceId: string;

  /** 是否核心免低区域：1=是，0=否 */
  @Column({ type: 'tinyint', default: 0 })
  isCoreArea: number;

  /** 记录创建时间，自动写入 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}