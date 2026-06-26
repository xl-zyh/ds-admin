import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * 场馆/地标实体
 *
 * 存储场馆名称、地址及经纬度坐标，用于地图标记展示
 */
@Entity('venues')
@Index(['provinceId', 'cityId'])
export class Venue {
  @PrimaryGeneratedColumn()
  id: number;

  /** 场馆名称 */
  @Column({ length: 100 })
  name: string;

  /** 地址描述 */
  @Column({ length: 255, nullable: true })
  address: string;

  /** 纬度 */
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lat: number;

  /** 经度 */
  @Column({ type: 'decimal', precision: 10, scale: 7 })
  lng: number;

  /** 省份编号 */
  @Column({ nullable: true })
  provinceId: number;

  /** 城市编号 */
  @Column({ nullable: true })
  cityId: number;

  /** 区县编号 */
  @Column({ nullable: true })
  districtId: number;

  /** 创建时间 */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}