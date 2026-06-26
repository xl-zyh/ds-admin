import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Role } from './role.entity';
import { User } from '../user/user.entity';

/**
 * 角色服务 — 角色 CRUD + 超管保护逻辑
 *
 * 超管保护规则：
 * 1. 系统最多只能有一个活动的超级管理员角色
 * 2. 创建超管角色时，检查是否已存在活动的超管
 * 3. 更新为超管角色时，检查是否已有其他活动的超管
 * 4. 删除超管角色时，检查是否会导致无超管（防御性）
 * 5. 删除超管角色时，检查是否有用户正在使用该角色
 */
@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /** 获取所有角色 */
  findAll(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  /** 根据 ID 查询单个角色 */
  findById(id: number): Promise<Role | null> {
    return this.roleRepo.findOneBy({ id });
  }

  /** 统计当前活动的超级管理员角色数 */
  async countSuperAdmins(excludeId?: number): Promise<number> {
    const where: any = { isSuper: true, isActive: true };
    if (excludeId !== undefined) {
      return this.roleRepo.count({
        where: { id: Not(excludeId), isSuper: true, isActive: true },
      });
    }
    return this.roleRepo.count({ where });
  }

  /** 统计使用指定角色的用户数 */
  async countUsersByRole(roleId: number): Promise<number> {
    return this.userRepo.count({ where: { roleId } });
  }

  /**
   * 创建角色
   *
   * 如果 isSuper 为 true，且已存在活动的超管角色，拒绝创建
   *
   * @throws 403 已存在超管角色，不能再创建
   */
  async create(data: Partial<Role>): Promise<Role> {
    if (data.isSuper) {
      const count = await this.countSuperAdmins();
      if (count > 0) {
        throw new ForbiddenException('已存在超级管理员角色，系统中只能有一个超管');
      }
    }

    const role = this.roleRepo.create(data);
    return this.roleRepo.save(role);
  }

  /**
   * 更新角色信息（名称、描述、启用/禁用、超管标记）
   *
   * 如果 isSuper 从 false 改为 true，且已有其他活动的超管角色，拒绝更新
   * 如果目标角色是超管角色，禁止将其禁用
   *
   * @throws 403 已存在其他超管角色
   * @throws 403 禁止禁用超级管理员角色
   */
  async update(id: number, data: Partial<Role>): Promise<Role | null> {
    const existing = await this.findById(id);
    if (existing?.isSuper && data.isActive === false) {
      throw new ForbiddenException('禁止禁用超级管理员角色');
    }

    if (data.isSuper) {
      const count = await this.countSuperAdmins(id);
      if (count > 0) {
        throw new ForbiddenException('已存在其他超级管理员角色，系统中只能有一个超管');
      }
    }

    await this.roleRepo.update(id, data);
    return this.findById(id);
  }

  /**
   * 删除角色（含超管保护）
   *
   * 如果目标角色是超级管理员：
   *   1. 检查是否有用户正在使用该角色 → 有则拒绝
   *   2. 统计当前所有活动的超管角色数量 → 若 ≤ 1，拒绝删除（403 Forbidden）
   *
   * @throws 403 角色不存在
   * @throws 403 有用户正在使用该超管角色，禁止删除
   * @throws 403 禁止删除最后一个超级管理员角色
   */
  async remove(id: number): Promise<void> {
    const role = await this.roleRepo.findOneBy({ id });
    if (!role) throw new ForbiddenException('角色不存在');

    if (role.isSuper) {
      const userCount = await this.countUsersByRole(id);
      if (userCount > 0) {
        throw new ForbiddenException(`有 ${userCount} 个用户正在使用该超管角色，禁止删除`);
      }

      const count = await this.countSuperAdmins();
      if (count <= 1) {
        throw new ForbiddenException('禁止删除最后一个超级管理员角色');
      }
    }

    await this.roleRepo.delete(id);
  }
}