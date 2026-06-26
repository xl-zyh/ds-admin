import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { SuperAdminKey } from './super-admin-key.entity';
import { SuperAdminKeyHistory } from './super-admin-key-history.entity';
import { constants } from 'buffer';

/**
 * 口令复杂度校验正则：
 * - 长度 ≥ 16
 * - 至少 1 大写字母
 * - 至少 1 小写字母
 * - 至少 1 数字
 * - 至少 1 特殊字符
 */
const KEY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]).{16,}$/;

/** AES-256-GCM 加密密钥，必须恰好 32 字节 */
const ENCRYPTION_KEY = Buffer.from('uics-2026-super-admin-encryptkey', 'utf-8');

/**
 * AES-256-GCM 加密
 * 返回加密密文（含 authTag 前缀，格式：authTag(16字节hex) + ciphertext）
 */
function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted: authTag + encrypted, iv: iv.toString('hex') };
}

/**
 * AES-256-GCM 解密
 * @param encrypted 密文（authTag 前缀格式）
 * @param iv 初始化向量
 */
function decrypt(encrypted: string, iv: string): string {
  const authTagHex = encrypted.slice(0, 32); // authTag 为 16 bytes = 32 hex chars
  const ciphertext = encrypted.slice(32);
  const decipher = createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(SuperAdminKey)
    private keyRepo: Repository<SuperAdminKey>,
    @InjectRepository(SuperAdminKeyHistory)
    private historyRepo: Repository<SuperAdminKeyHistory>,
  ) {}

  /** 设置新的超管操作密钥 */
  async setKey(rawKey: string, setBy: string) {
    // 1. 校验复杂度
    if (!KEY_PATTERN.test(rawKey)) {
      throw new BadRequestException('口令需 ≥16 位，且包含大小写字母、数字、特殊字符');
    }

    // 2. 校验不与前 5 次重复
    const recentKeys = await this.keyRepo.find({ order: { createdAt: 'DESC' }, take: 1 });
    const histories = await this.historyRepo.find({ order: { createdAt: 'DESC' }, take: 5 });
    const allHashes = [...recentKeys.map((k) => k.passwordHash), ...histories.map((h) => h.passwordHash)];

    for (const hash of allHashes) {
      if (await bcrypt.compare(rawKey, hash)) {
        throw new BadRequestException('新口令不得与前 5 次口令重复');
      }1
    }

    // 3. 将旧密钥移入历史
    const oldKey = await this.keyRepo.findOne({ where: {} });
    if (oldKey) {
      await this.historyRepo.save(
        this.historyRepo.create({
          passwordHash: oldKey.passwordHash,
          createdAt: oldKey.createdAt,
          setBy: oldKey.setBy,
        }),
      );
      await this.keyRepo.delete(oldKey.id);
    }

    // 4. 保存新密钥（哈希 + 加密）
    const hash = await bcrypt.hash(rawKey, 12);
    const { encrypted, iv } = encrypt(rawKey);
    return this.keyRepo.save(this.keyRepo.create({ passwordHash: hash, encryptedKey: encrypted, iv, setBy }));
  }

  /** 校验操作密钥 */
  async verify(rawKey: string): Promise<boolean> {
    const currentKey = await this.keyRepo.findOne({ where: {} });
    if (!currentKey) {
      throw new NotFoundException('尚未设置超管操作密钥，请先初始化');
    }
    return bcrypt.compare(rawKey, currentKey.passwordHash);
  }

  /** 检查是否需要强制更换（超过 90 天） */
  async checkRotation(): Promise<{ needRotation: boolean; daysSinceSet: number }> {
    const currentKey = await this.keyRepo.findOne({ where: {} });
    if (!currentKey) {
      return { needRotation: true, daysSinceSet: 0 };
    }
    const daysSinceSet = Math.floor(
      (Date.now() - currentKey.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    return { needRotation: daysSinceSet >= 90, daysSinceSet };
  }

  /** 检查密钥是否已初始化 */
  async isInitialized(): Promise<boolean> {
    const count = await this.keyRepo.count();
    return count > 0;
  }

  /** 获取密钥详情（包含解密后的明文，仅超管可见） */
  async getKeyDetail(): Promise<{
    initialized: boolean;
    key?: string;
    createdAt?: Date;
    setBy?: string;
    daysSinceSet: number;
    needRotation: boolean;
    needReset: boolean;
  }> {
    const currentKey = await this.keyRepo.findOne({ where: {} });
    if (!currentKey) {
      return { initialized: false, daysSinceSet: 0, needRotation: true, needReset: false };
    }
    const daysSinceSet = Math.floor(
      (Date.now() - currentKey.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    let key: string | undefined;
    let needReset = false;
    if (currentKey.encryptedKey && currentKey.iv) {
      try {
        key = decrypt(currentKey.encryptedKey, currentKey.iv);
      } catch {
        needReset = true;
      }
    } else {
      needReset = true;
    }

    return {
      initialized: true,
      key,
      createdAt: currentKey.createdAt,
      setBy: currentKey.setBy,
      daysSinceSet,
      needRotation: daysSinceSet >= 90,
      needReset,
    };
  }
}