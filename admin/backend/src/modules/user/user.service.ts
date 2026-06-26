import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserStatus } from './user.entity';

/**
 * 用户服务 — 账号全生命周期管理
 *
 * 核心规则：
 * - 系统不开放公开注册，所有账号由管理员创建
 * - 新建账号默认状态为"未激活"（inactive）
 * - 新建账号默认无角色（最小权限原则）
 * - 密码仅以 bcrypt 哈希存储，明文不落库
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /** 获取所有用户（含关联角色） */
  findAll(): Promise<User[]> {
    return this.userRepo.find({ relations: { role: true } });
  }

  /** 根据 ID 查询用户（含关联角色） */
  findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: { role: true } });
  }

  /** 根据用户名查询用户（含关联角色），用于登录校验 */
  findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { username }, relations: { role: true } });
  }

  /** 根据邮箱查询用户，用于去重检查 */
  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  /**
   * 管理员创建账号（邀请制）
   *
   * 创建流程：
   * 1. 检查用户名、邮箱是否已存在
   * 2. 若未指定密码，自动生成 12 位随机密码
   * 3. bcrypt 哈希存储
   * 4. 默认状态：inactive（未激活）
   * 5. 默认角色：无（roleId 为 NULL）
   *
   * @returns 用户对象 + 明文密码（仅此一次返回，需交付用户）
   */
  async createByAdmin(data: {
    username: string;
    email: string;
    password?: string;
    nickname?: string;
    roleId?: number;
  }) {
    const existing = await this.findByUsername(data.username);
    if (existing) throw new BadRequestException('用户名已存在');

    if (data.email) {
      const emailUser = await this.findByEmail(data.email);
      if (emailUser) throw new BadRequestException('邮箱已被使用');
    }

    // 生成随机密码：12 位，含大小写字母 + 数字
    const plainPassword = data.password || this.generateRandomPassword();
    const hashed = await bcrypt.hash(plainPassword, 10);

    const user = this.userRepo.create({
      username: data.username,
      email: data.email,
      password: hashed,
      nickname: data.nickname || data.username,
      roleId: data.roleId || undefined,
      status: UserStatus.INACTIVE,
    });

    const saved = await this.userRepo.save(user);
    return { ...saved, plainPassword };
  }

  /** 内部 create —— 不生成密码，直接传入已加密值，供种子脚本使用 */
  create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  /**
   * 更新用户信息 + 激活/锁定等状态变更
   *
   * 状态校验：status 只能是 UserStatus 枚举中的值
   * 超管保护：禁止将超管账号状态设为非正常
   */
  async update(id: number, data: Partial<User> & { superAdminKey?: string }): Promise<User | null> {
    if (data.status && !Object.values(UserStatus).includes(data.status)) {
      throw new BadRequestException('无效的用户状态');
    }

    // 禁止将超管账号设为非正常状态
    if (data.status && data.status !== UserStatus.NORMAL) {
      const existing = await this.findById(id);
      if (existing?.role?.isSuper) {
        throw new ForbiddenException('禁止将超级管理员账号设为非正常状态');
      }
    }

    const { superAdminKey, ...updateData } = data;
    await this.userRepo.update(id, updateData);
    return this.findById(id);
  }

  /** 删除用户（硬删除） */
  async remove(id: number): Promise<void> {
    await this.userRepo.delete(id);
  }

  /**
   * 生成随机密码
   *
   * 规则：12 位，包含大写字母、小写字母、数字
   * 不包含易混淆字符（0/O、1/l/I）
   *
   * @returns 12 位随机密码字符串
   */
  private generateRandomPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 排除 O
    const lower = 'abcdefghijkmnpqrstuvwxyz'; // 排除 l、o
    const digits = '23456789';                 // 排除 0、1
    const all = upper + lower + digits;

    let password = '';
    // 确保至少包含一类字符
    password += upper[Math.floor(Math.random() * upper.length)];
    password += lower[Math.floor(Math.random() * lower.length)];
    password += digits[Math.floor(Math.random() * digits.length)];

    // 剩余 9 位随机
    for (let i = 0; i < 9; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // 打乱顺序
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}