<template>
  <div>
    <div style="margin-bottom: 16px; display: flex; justify-content: space-between">
      <h3 style="margin: 0">设备编码管理</h3>
      <el-button v-if="auth.hasPermission('device:generate')" type="primary" @click="openGenerateDialog()">生成编码</el-button>
    </div>

    <!-- 扫描验证 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true">
        <el-form-item label="扫描编码">
          <el-input v-model="scanCode" placeholder="输入或扫描设备编码" style="width: 280px" @keyup.enter="handleScan" />
        </el-form-item>
        <el-form-item v-if="auth.hasPermission('device:scan')">
          <el-button type="success" :loading="scanning" @click="handleScan">验证并使用</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 筛选栏 -->
    <el-card style="margin-bottom: 16px">
      <el-form :inline="true" :model="filters">
        <el-form-item label="设备名称">
          <el-input v-model="filters.deviceName" placeholder="模糊搜索" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="可用" value="available" />
            <el-option label="已使用" value="used" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-table :data="tableData" border stripe v-loading="loading">
      <el-table-column prop="code" label="设备编码" width="200" />
      <el-table-column prop="deviceName" label="设备名称" width="150" />
      <el-table-column prop="port" label="端口" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'available' ? 'success' : 'info'" size="small">
            {{ row.status === 'available' ? '可用' : '已使用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="usedBy" label="使用人" width="100" />
      <el-table-column prop="usedAt" label="使用时间" width="160">
        <template #default="{ row }">{{ formatTime(row.usedAt) }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="生成时间" width="160">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column v-if="auth.hasPermission('device:delete')" label="操作" width="80">
        <template #default="{ row }">
          <el-popconfirm title="删除后仅管理端不可见，用户端仍可查询" @confirm="handleDelete(row.id)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center">
      <span style="color: #909399; font-size: 13px">编码一经使用不可二次扫描，管理员删除仅隐藏管理端显示</span>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @change="fetchData"
      />
    </div>

    <!-- 生成编码弹窗 -->
    <el-dialog v-model="generateDialogVisible" title="生成设备编码" width="450px">
      <el-form ref="genFormRef" :model="genForm" :rules="genRules" label-width="100px">
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="genForm.deviceName" placeholder="如：闸机-A01" />
        </el-form-item>
        <el-form-item label="端口号" prop="port">
          <el-input v-model="genForm.port" placeholder="如：COM3" />
        </el-form-item>
        <el-form-item label="设备信息" prop="deviceInfo">
          <el-input v-model="genForm.deviceInfo" type="textarea" :rows="3" placeholder="JSON 格式的额外信息" />
        </el-form-item>
        <el-form-item label="生成数量" prop="count">
          <el-input-number v-model="genForm.count" :min="1" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { deviceApi, type DeviceCodeRecord } from '../../api/device'
import { useAuthStore } from '../../store/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const auth = useAuthStore()
const loading = ref(false)
const scanning = ref(false)
const generating = ref(false)
const tableData = ref<DeviceCodeRecord[]>([])
const pagination = ref({ page: 1, pageSize: 20, total: 0 })
const generateDialogVisible = ref(false)
const genFormRef = ref<FormInstance>()
const scanCode = ref('')

const filters = ref({
  deviceName: '',
  status: '',
  dateRange: null as [string, string] | null,
})

const genForm = ref({
  deviceName: '',
  deviceInfo: '',
  port: '',
  count: 1,
})

const genRules = {
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
}

function formatTime(val: string | null) {
  if (!val) return '-'
  return val.replace('T', ' ').slice(0, 19)
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
    }
    if (filters.value.deviceName) params.deviceName = filters.value.deviceName
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.dateRange) {
      params.startDate = filters.value.dateRange[0]
      params.endDate = filters.value.dateRange[1]
    }
    const result = await deviceApi.list(params)
    tableData.value = result.list
    pagination.value.total = result.total
  } finally {
    loading.value = false
  }
}

async function handleScan() {
  if (!scanCode.value.trim()) return
  scanning.value = true
  try {
    await deviceApi.scan(scanCode.value.trim())
    ElMessage.success(`编码 ${scanCode.value} 验证通过，已标记为已使用`)
    scanCode.value = ''
    await fetchData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '验证失败')
  } finally {
    scanning.value = false
  }
}

function openGenerateDialog() {
  genForm.value = { deviceName: '', deviceInfo: '', port: '', count: 1 }
  generateDialogVisible.value = true
}

async function handleGenerate() {
  const valid = await genFormRef.value?.validate().catch(() => false)
  if (!valid) return
  generating.value = true
  try {
    await deviceApi.generate(genForm.value)
    ElMessage.success(`成功生成 ${genForm.value.count} 个设备编码`)
    generateDialogVisible.value = false
    await fetchData()
  } finally {
    generating.value = false
  }
}

async function handleDelete(id: number) {
  await deviceApi.remove(id)
  await fetchData()
}

onMounted(fetchData)
</script>