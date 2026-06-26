import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { VenueService } from './venue.service';

@Controller('venues')
export class VenueController {
  constructor(private readonly venueService: VenueService) {}

  /** GET /venues — 获取所有场馆 */
  @Get()
  async findAll(@Query('keyword') keyword?: string) {
    return this.venueService.findAll(keyword);
  }

  /** GET /venues/:id — 获取单个场馆 */
  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.venueService.findById(id);
  }

  /** POST /venues — 新增场馆 */
  @Post()
  async create(@Body() body: { name: string; address?: string; lat: number; lng: number; provinceId?: number; cityId?: number; districtId?: number }) {
    return this.venueService.create(body);
  }

  /** PUT /venues/:id — 更新场馆 */
  @Put(':id')
  async update(@Param('id') id: number, @Body() body: Partial<{ name: string; address: string; lat: number; lng: number; provinceId: number; cityId: number; districtId: number }>) {
    return this.venueService.update(id, body);
  }

  /** DELETE /venues/:id — 删除场馆 */
  @Delete(':id')
  async remove(@Param('id') id: number) {
    await this.venueService.remove(id);
    return { message: '删除成功' };
  }
}