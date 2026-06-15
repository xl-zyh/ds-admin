import * as mysql from 'mysql2/promise';

/**
 * 数据库迁移：isActive (boolean) → status (enum)
 *
 * 背景：
 *   旧版用户表使用 `isActive: boolean` 控制启用/禁用。
 *   新版改为 `status: enum('normal','inactive','locked','disabled','resigned')`。
 *   TypeORM synchronize 会自动删除旧列、新增新列，但数据会丢失。
 *
 * 迁移策略（在 TypeORM 同步之前执行）：
 *   1. 检查 `isActive` 列是否存在 → 不存在则跳过（已迁移或新库）
 *   2. 添加 `status` 列（若不存在）
 *   3. 将 `isActive = true`  映射为 `status = 'normal'`
 *   4. 将 `isActive = false` 映射为 `status = 'disabled'`
 *   5. 删除 `isActive` 列
 *
 * 执行完毕后，TypeORM 同步时不会检测到差异。
 */

/** 检查表中是否存在某列 */
async function columnExists(
  conn: mysql.Connection,
  table: string,
  column: string,
): Promise<boolean> {
  const [rows] = await conn.query<any[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [table, column],
  );
  return rows.length > 0;
}

/** 执行 users 表字段迁移 */
export async function runMigration(): Promise<void> {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123456',
    database: process.env.DB_NAME || 'admin_system',
  };

  const conn = await mysql.createConnection(config);
  console.log('[Migrate] 连接数据库成功');

  try {
    const hasIsActive = await columnExists(conn, 'users', 'isActive');
    if (!hasIsActive) {
      console.log('[Migrate] isActive 列不存在，跳过迁移');
      return;
    }

    console.log('[Migrate] 检测到旧版 isActive 列，开始迁移...');

    // 1. 添加 status 列（若已存在则跳过）
    const hasStatus = await columnExists(conn, 'users', 'status');
    if (!hasStatus) {
      await conn.query(
        `ALTER TABLE users
         ADD COLUMN status ENUM('normal','inactive','locked','disabled','resigned')
         NOT NULL DEFAULT 'inactive'`,
      );
      console.log('[Migrate] ✓ 已添加 status 列');
    } else {
      console.log('[Migrate] status 列已存在，跳过添加');
    }

    // 2. 数据迁移
    const [result1] = await conn.query<any>(
      `UPDATE users SET status = 'normal' WHERE isActive = true`,
    );
    const [result2] = await conn.query<any>(
      `UPDATE users SET status = 'disabled' WHERE isActive = false`,
    );
    const activeCount = result1.affectedRows || 0;
    const inactiveCount = result2.affectedRows || 0;
    console.log(
      `[Migrate] ✓ 迁移完成 — ${activeCount} 个正常, ${inactiveCount} 个禁用`,
    );

    // 3. 删除旧列
    await conn.query(`ALTER TABLE users DROP COLUMN isActive`);
    console.log('[Migrate] ✓ 已删除 isActive 列');
  } finally {
    await conn.end();
    console.log('[Migrate] 数据库连接已关闭');
  }
}