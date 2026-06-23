import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * 客流汇总实体 — 每日/每周/每月场馆客流统计数据
 *
 * 数据由场馆系统按频率推送到全民健身信息服务平台后，
 * 本系统从平台拉取或由设备直接上报存储。
 *
 * 行政区划编码参照 GB/T 2260-2007
 * 场馆编号参照《体育场馆信息化管理服务系统技术规范》
 */
@Entity('flow_summaries')
@Index(['venueId', 'time'])
@Index(['provinceId', 'cityId', 'districtId'])
export class FlowSummary {
  @PrimaryGeneratedColumn()
  id: number;

  /** 场馆中文名称，如"新乡体育场" */
  @Column({ length: 100 })
  equipmentCode: string;

  /** 统计日期，yyyy-MM-dd HH:mm:ss */
  @Column({ type: 'datetime' })
  time: Date;

  /** 总进客流量 */
  @Column({ type: 'bigint' })
  inCount: number;

  /** 总出客流量 */
  @Column({ type: 'bigint' })
  outCount: number;

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

  /** 记录创建时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}