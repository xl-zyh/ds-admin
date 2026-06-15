# API 接口文档

> 后端：NestJS + TypeORM + MySQL
> 认证：JWT（Bearer Token），有效期 7 天
> 基础地址：`http://localhost:3000`

---

## 目录

- [全局说明](#全局说明)
- [认证 Auth](#1-认证-auth)
- [用户管理 Users](#2-用户管理-users)
- [角色管理 Roles](#3-角色管理-roles)
- [新增接口规范](#新增接口规范)

---

## 全局说明

### 公共请求头

| Header | 值 | 说明 |
|--------|-----|------|
| `Content-Type` | `application/json` | 请求体格式 |
| `Authorization` | `Bearer <token>` | 需登录的接口必传 |

### 公共响应格式

```json
// 成功 — 直接返回数据体
{ "id": 1, "username": "admin" }

// 失败 —
{ "message": "错误描述", "statusCode": 4xx }
```

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未登录 / token 过期 |
| 403 | 无权限 / 账号状态异常 |
| 404 | 资源不存在 |
| 500 | 服务端错误 |

### 权限码一览

| 权限码 | 说明 |
|--------|------|
| `user:read` | 查看用户列表 |
| `user:create` | 新增用户 |
| `user:update` | 编辑用户 |
| `user:delete` | 删除用户 |
| `role:read` | 查看角色列表 |
| `role:create` | 新增角色 |
| `role:update` | 编辑角色 |
| `role:delete` | 删除角色 |

> 超管角色（`isSuper = true`）隐式拥有所有权限，无需配置权限码。

---

## 1. 认证 Auth

### POST /auth/login — 用户登录

**无需认证**

Request:
```json
{
  "username": "admin",
  "password": "123123"
}
```

Response `200`:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "nickname": "admin",
    "email": "admin@example.com",
    "roleId": 1,
    "status": "normal",
    "isSuper": true
  }
}
```

> `isSuper` 来自关联角色表的 `isSuper` 字段。

Errors:
| 状态码 | message |
|--------|---------|
| 401 | `用户不存在` / `密码错误` |
| 403 | `账号未激活，请联系管理员` / `账号已被锁定` / `账号已被禁用` / `账号已离职` |

---

### GET /auth/profile — 获取当前用户信息

**需认证** — Header: `Authorization: Bearer <token>`

Response `200`:
```json
{
  "id": 1,
  "username": "admin",
  "nickname": "admin",
  "email": "admin@example.com",
  "status": "normal",
  "roleId": 1,
  "role": {
    "id": 1,
    "name": "super_admin",
    "description": "超级管理员",
    "isSuper": true,
    "permissions": ["user:read", "user:create", "user:update", "user:delete", "role:read", "role:create", "role:update", "role:delete"],
    "isActive": true
  },
  "createdAt": "2026-06-14T10:00:00.000Z"
}
```

> 密码字段 `password` 不会返回。

---

## 2. 用户管理 Users

**所有接口需认证 + 权限** — Header: `Authorization: Bearer <token>`

### GET /users — 获取用户列表

**权限**：`user:read`

Response `200`:
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "admin",
    "status": "normal",
    "roleId": 1,
    "role": { "id": 1, "name": "super_admin", "isSuper": true },
    "createdAt": "2026-06-14T10:00:00.000Z"
  }
]
```

---

### GET /users/:id — 获取单个用户

**权限**：`user:read`

Response `200`：同上单条数据

---

### POST /users — 管理员创建账号

**权限**：`user:create`

Request:
```json
{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "nickname": "张三",
  "password": "Abc123456",      // 可选，不传自动生成 12 位随机密码
  "roleId": 2                   // 可选，不传则无角色（最小权限）
}
```

Response `201`:
```json
{
  "id": 2,
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "nickname": "张三",
  "roleId": 2,
  "status": "inactive",
  "plainPassword": "Abc123456",
  "createdAt": "2026-06-15T12:00:00.000Z"
}
```

> 默认状态为 `inactive`（未激活），需管理员手动改为 `normal` 后方可登录。
> `plainPassword` 仅在创建时返回一次，用于交付账号。

Error: `400 — 用户名已存在` / `400 — 邮箱已被使用`

---

### PUT /users/:id — 更新用户信息

**权限**：`user:update`

Request（字段全可选）:
```json
{
  "nickname": "张三丰",
  "email": "zhangsanfeng@example.com",
  "roleId": 3,
  "status": "normal"
}
```

> `status` 可选值：`normal` / `inactive` / `locked` / `disabled` / `resigned`

Response `200`：返回更新后的完整用户对象

---

### DELETE /users/:id — 删除用户

**权限**：`user:delete`

Response `200`：无返回体（空）

---

## 3. 角色管理 Roles

**所有接口需认证 + 权限** — Header: `Authorization: Bearer <token>`

### GET /roles — 获取角色列表

**权限**：`role:read`

Response `200`:
```json
[
  {
    "id": 1,
    "name": "super_admin",
    "description": "超级管理员",
    "isSuper": true,
    "permissions": ["user:read", "user:create", "user:update", "user:delete", "role:read", "role:create", "role:update", "role:delete"],
    "isActive": true,
    "createdAt": "2026-06-14T10:00:00.000Z"
  }
]
```

---

### POST /roles — 创建角色

**权限**：`role:create`

Request:
```json
{
  "name": "运营编辑",
  "description": "内容运营团队",
  "isSuper": false,
  "permissions": ["user:read", "role:read"]
}
```

> `isSuper` 默认为 `false`，超管角色系统只允许存在一个。

Response `201`：返回创建后的角色对象

---

### PUT /roles/:id — 更新角色信息

**权限**：`role:update`

> 仅超级管理员应有此权限。编辑权限即分配系统权力。

Request（字段全可选）:
```json
{
  "name": "高级运营",
  "description": "高级内容运营",
  "isActive": true,
  "permissions": ["user:read", "user:create", "role:read"]
}
```

Response `200`：返回更新后的完整角色对象

---

### DELETE /roles/:id — 删除角色

**权限**：`role:delete`

> 禁止删除最后一个活动的超管角色。

Response `200`：无返回体（空）

Error: `400 — 禁止删除最后一个超级管理员角色`

---

## 新增接口规范

每次新增 API 接口时，请按以下步骤操作：

### 1. 在控制器中添加 JSDoc

```typescript
/**
 * 接口简短描述
 *
 * @route GET /api/模块名/路径
 * @auth 是否需要 JWT 认证（需认证 / 无需认证）
 * @permission 所需权限码
 *
 * @param 参数名 参数说明
 * @returns 返回说明
 * @throws 状态码 错误条件
 *
 * @note 其他注意事项
 */
```

### 2. 在 API.md 中追加接口说明

按此模板追加：

```markdown
### METHOD /path — 接口名称

**权限**：`resource:action`

Request:
```json
{
  "field": "value"
}
```

Response `200`:
```json
{
  "field": "value"
}
```

Errors:
| 状态码 | 说明 |
|--------|------|
| 400 | 错误条件说明 |
```