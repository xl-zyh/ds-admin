<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <h3 style="margin: 0">用户列表</h3>
      <el-button v-if="auth.hasPermission('user:create')" type="primary" @click="openDialog()">新增用户</el-button>
    </div>

    <el-table :data="users" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column label="角色" width="100">
        <template #default="{ row }">
          {{ row.role?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusTagType(row.status)" size="small">
            {{ statusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="auth.hasPermission('user:update') || auth.hasPermission('user:delete')" label="操作" width="180">
        <template #default="{ row }">
          <el-button v-if="auth.hasPermission('user:update')" size="small" @click="openDialog(row)">编辑</el-button>
          <el-popconfirm v-if="auth.hasPermission('user:delete')" :title="row.role?.isSuper ? '删除超管账号需验证操作密钥，确认继续？' : '确认删除？'" @confirm="handleDelete(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑用户' : '新增用户'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!editingId" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!editingId">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.roleId" placeholder="请选择" style="width: 100%">
            <el-option v-for="r in roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="editingId">
          <el-select v-model="form.status" style="width: 100%">
            <el-option
              v-for="s in statusOptions"
              :key="s.value"
              :label="s.label"
              :value="s.value"
              :disabled="isEditingSuperAdmin && s.value !== 'normal'"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 超管操作密钥验证弹窗 -->
    <el-dialog v-model="superAdminKeyDialogVisible" title="超管操作验证" width="400px" :close-on-click-modal="false">
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        {{ pendingAction === 'edit' ? '修改超管账号需要验证操作密钥' : '删除超管账号需要验证操作密钥' }}
      </el-alert>
      <el-form ref="keyFormRef" :model="keyForm" :rules="keyRules" label-width="0">
        <el-form-item prop="superAdminKey">
          <el-input v-model="keyForm.superAdminKey" type="password" show-password placeholder="请输入超管操作密钥" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="superAdminKeyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifying" @click="handleVerifyAndExecute">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { userApi } from '../../api/user'
import { roleApi } from '../../api/role'
import { superAdminApi } from '../../api/super-admin'
import { useAuthStore } from '../../store/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const auth = useAuthStore()
const users = ref<any[]>([])
const roles = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

// 超管密钥验证
const superAdminKeyDialogVisible = ref(false)
const verifying = ref(false)
const keyFormRef = ref<FormInstance>()
const keyForm = ref({ superAdminKey: '' })
const pendingAction = ref<'edit' | 'delete'>('edit')
const pendingUserId = ref<number | null>(null)

const keyRules = {
  superAdminKey: [{ required: true, message: '请输入超管操作密钥', trigger: 'blur' }],
}

/** 当前编辑的用户是否为超管 */
const isEditingSuperAdmin = computed(() => {
  if (!editingId.value) return false
  const user = users.value.find((u) => u.id === editingId.value)
  return user?.role?.isSuper || false
})

const statusOptions = [
  { value: 'normal', label: '正常' },
  { value: 'inactive', label: '未激活' },
  { value: 'locked', label: '已锁定' },
  { value: 'disabled', label: '已禁用' },
  { value: 'resigned', label: '已离职' },
]

function statusLabel(val: string) {
  const map: Record<string, string> = {
    normal: '正常', inactive: '未激活', locked: '已锁定',
    disabled: '已禁用', resigned: '已离职',
  }
  return map[val] || val
}

function statusTagType(val: string) {
  const map: Record<string, string> = {
    normal: 'success', inactive: 'warning', locked: 'info',
    disabled: 'danger', resigned: '',
  }
  return map[val] || 'info'
}

const form = ref({ username: '', password: '', nickname: '', email: '', roleId: null as number | null, status: 'normal' })
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/, message: '以字母开头，3-20位字母/数字/下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^.{6,20}$/, message: '6-20位字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5a-zA-Z0-9]{2,20}$/, message: '2-20位中文/字母/数字', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/, message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

async function fetchData() {
  loading.value = true
  try {
    const [u, r] = await Promise.all([userApi.list(), roleApi.list()])
    users.value = u
    roles.value = r
  } finally {
    loading.value = false
  }
}

function openDialog(row?: any) {
  if (row) {
    editingId.value = row.id
    form.value = { username: row.username, password: '', nickname: row.nickname, email: row.email, roleId: row.roleId, status: row.status }
  } else {
    editingId.value = null
    form.value = { username: '', password: '', nickname: '', email: '', roleId: null, status: 'normal' }
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  // 如果编辑的是超管账号，需要先验证密钥
  if (isEditingSuperAdmin.value) {
    pendingAction.value = 'edit'
    pendingUserId.value = editingId.value
    keyForm.value.superAdminKey = ''
    superAdminKeyDialogVisible.value = true
    return
  }

  await doSave()
}

async function doSave() {
  saving.value = true
  try {
    if (editingId.value) {
      const { username, password, roleId, ...rest } = form.value
      const data: any = { ...rest }
      if (roleId) data.roleId = roleId
      // 如果是超管，附带密钥
      if (isEditingSuperAdmin.value) {
        data.superAdminKey = keyForm.value.superAdminKey
      }
      await userApi.update(editingId.value, data)
    } else {
      await userApi.create(form.value as any)
    }
    dialogVisible.value = false
    superAdminKeyDialogVisible.value = false
    await fetchData()
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  if (row.role?.isSuper) {
    pendingAction.value = 'delete'
    pendingUserId.value = row.id
    keyForm.value.superAdminKey = ''
    superAdminKeyDialogVisible.value = true
    return
  }
  await doDelete(row.id)
}

async function doDelete(id: number) {
  await userApi.remove(id, keyForm.value.superAdminKey)
  superAdminKeyDialogVisible.value = false
  await fetchData()
}

async function handleVerifyAndExecute() {
  const valid = await keyFormRef.value?.validate().catch(() => false)
  if (!valid) return
  verifying.value = true
  try {
    const { valid: keyValid } = await superAdminApi.verifyKey(keyForm.value.superAdminKey)
    if (!keyValid) {
      ElMessage.error('超管操作密钥验证失败')
      return
    }
    if (pendingAction.value === 'edit') {
      await doSave()
    } else {
      await doDelete(pendingUserId.value!)
    }
  } finally {
    verifying.value = false
  }
}

onMounted(fetchData)
</script>
