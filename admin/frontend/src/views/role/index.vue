<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <h3 style="margin: 0">角色列表</h3>
      <el-button v-if="auth.hasPermission('role:create')" type="primary" @click="openDialog()">新增角色</el-button>
    </div>

    <el-table :data="roles" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="角色名称" width="150" />
      <el-table-column prop="description" label="描述" />
      <el-table-column prop="isSuper" label="超管" width="70">
        <template #default="{ row }">
          <el-tag v-if="row.isSuper" type="danger" size="small">超管</el-tag>
          <span v-else style="color:#999">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
            {{ row.isActive ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ new Date(row.createdAt).toLocaleDateString('zh-CN') }}
        </template>
      </el-table-column>
      <el-table-column v-if="auth.hasPermission('role:update') || auth.hasPermission('role:delete')" label="操作" width="200">
        <template #default="{ row }">
          <el-button v-if="auth.hasPermission('role:update')" size="small" @click="openDialog(row)">编辑</el-button>
          <el-popconfirm
            v-if="auth.hasPermission('role:delete')"
            :title="row.isSuper ? '该角色为超级管理员，确认删除？' : '确认删除？'"
            :confirm-button-text="row.isSuper ? '确认删除' : '确认'"
            :confirm-button-type="row.isSuper ? 'danger' : 'primary'"
            @confirm="handleDelete(row.id)"
          >
            <template #reference>
              <el-button size="small" :type="row.isSuper ? 'warning' : 'danger'">
                {{ row.isSuper ? '删除超管' : '删除' }}
              </el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="超级管理员">
          <el-switch v-model="form.isSuper" :disabled="!allowSetSuper" active-text="是" inactive-text="否" />
          <span v-if="form.isSuper && allowSetSuper" style="margin-left:8px;color:#e6a23c;font-size:12px">
            ⚠ 超管拥有最高权限，请谨慎操作
          </span>
          <span v-if="!allowSetSuper" style="margin-left:8px;color:#909399;font-size:12px">
            系统中已存在超管角色，只能有一个
          </span>
        </el-form-item>
        <el-form-item label="状态" v-if="editingId">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { roleApi } from '../../api/role'
import { useAuthStore } from '../../store/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const auth = useAuthStore()
const roles = ref<any[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = ref({ name: '', description: '', isSuper: false, isActive: true })
const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

/** 是否已存在活动的超管角色 */
const hasSuperAdmin = computed(() => roles.value.some((r) => r.isSuper))

/** 新建角色时是否允许设为超管 */
const allowSetSuper = computed(() => {
  if (editingId.value) {
    // 编辑：若是当前这个角色本身就是超管，允许关闭；否则不允许打开
    const current = roles.value.find((r) => r.id === editingId.value)
    return current?.isSuper || !hasSuperAdmin.value
  }
  // 新建
  return !hasSuperAdmin.value
})

async function fetchData() {
  loading.value = true
  try {
    roles.value = await roleApi.list()
  } finally {
    loading.value = false
  }
}

function openDialog(row?: any) {
  if (row) {
    editingId.value = row.id
    form.value = { name: row.name, description: row.description, isSuper: row.isSuper, isActive: row.isActive }
  } else {
    editingId.value = null
    form.value = { name: '', description: '', isSuper: false, isActive: true }
  }
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (editingId.value) {
      await roleApi.update(editingId.value, form.value)
    } else {
      await roleApi.create({ name: form.value.name, description: form.value.description, isSuper: form.value.isSuper })
    }
    dialogVisible.value = false
    await fetchData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await roleApi.remove(id)
    await fetchData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(fetchData)
</script>
