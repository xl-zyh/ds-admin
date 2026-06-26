import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Venue } from './venue.entity';

@Injectable()
export class VenueService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
  ) {}

  /** 查询所有场馆（支持关键词搜索） */
  async findAll(keyword?: string): Promise<Venue[]> {
    const where = keyword
      ? [{ name: Like(`%${keyword}%`) }, { address: Like(`%${keyword}%`) }]
      : {};
    return this.venueRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  /** 根据 ID 查询 */
  async findById(id: number): Promise<Venue | null> {
    return this.venueRepo.findOne({ where: { id } });
  }

  /** 新增场馆 */
  async create(data: Partial<Venue>): Promise<Venue> {
    const venue = this.venueRepo.create(data);
    return this.venueRepo.save(venue);
  }

  /** 更新场馆 */
  async update(id: number, data: Partial<Venue>): Promise<Venue | null> {
    await this.venueRepo.update(id, data);
    return this.findById(id);
  }

  /** 删除场馆 */
  async remove(id: number): Promise<void> {
    await this.venueRepo.delete(id);
  }

  /** 同步场馆坐标（根据 provinceId + cityId 批量更新） */
  async syncCoordinates(provinceId: number, cityId: number, lat: number, lng: number): Promise<void> {
    await this.venueRepo.update({ provinceId, cityId }, { lat, lng });
  }
}